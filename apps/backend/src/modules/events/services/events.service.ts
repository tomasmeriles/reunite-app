import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import { AttendeeStatus, EventRole, EventStatus } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { defined } from '../../../common/helpers/prisma.helpers';
import {
  assertEventStatus,
  requireEventStatus,
} from '../../../common/helpers/event-status.helper';
import { AbilityCacheService } from '../../../casl/services/ability-cache.service';
import type { SafeUser } from '../../users/selects/user.select';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import type { UpdateEventConfigDto } from '../dto/update-event-config.dto';
import type { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { eventDefaultOrderBy } from '../constants/event.constants';
import {
  assertValidTransition,
  CONFIG_EDITABLE_STATUSES,
  isContentEditableStatus,
  isFullyEditableStatus,
} from '../helpers/event-state-machine.helper';
import { EventTransitionsQueueService } from '../queue/event-transitions.queue';
import {
  eventDetailInclude,
  eventListInclude,
  eventPublicInclude,
  eventWithMembersInclude,
  type EventDetailPayload,
  type EventListPayload,
  type EventPublicPayload,
  type EventWithMembersPayload,
} from '../selects/event.select';
import { DateTime } from 'luxon';
import { AttendeeAccess, EventType, MediaAccess } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '@prisma/client';

type JobAction =
  | 'schedule-auto-active'
  | 'schedule-auto-ended'
  | 'cancel-auto-active'
  | 'cancel-auto-ended';

const TRANSITION_JOB_ACTIONS: Record<EventStatus, JobAction[]> = {
  [EventStatus.PUBLISHED]: ['schedule-auto-active'],
  [EventStatus.RESCHEDULED]: ['schedule-auto-active'],
  [EventStatus.ACTIVE]: ['cancel-auto-active', 'schedule-auto-ended'],
  [EventStatus.ENDED]: ['cancel-auto-ended'],
  [EventStatus.CANCELLED]: ['cancel-auto-active', 'cancel-auto-ended'],
  [EventStatus.DRAFT]: [],
};

@Injectable()
export class EventsService extends TransactionalService {
  private readonly logger = new Logger(EventsService.name);

  @Inject(AbilityCacheService)
  private readonly abilityCache!: AbilityCacheService;

  @Inject(EventTransitionsQueueService)
  private readonly transitionsQueue!: EventTransitionsQueueService;

  @Inject(NotificationsService)
  private readonly notificationsService!: NotificationsService;

  private computeEndAt(startAt: Date, durationMinutes: number): Date {
    return DateTime.fromJSDate(startAt)
      .plus({ minutes: durationMinutes })
      .toJSDate();
  }

  private normalizePrivateEventAccess<
    T extends {
      attendeeAccess?: AttendeeAccess;
      mediaAccess?: MediaAccess;
    },
  >(eventType: EventType, config: T): T {
    if (eventType === EventType.PUBLIC) {
      return config;
    }

    return {
      ...config,
      ...(config.attendeeAccess === AttendeeAccess.ANYONE
        ? { attendeeAccess: AttendeeAccess.ATTENDEES_ONLY }
        : {}),
      ...(config.mediaAccess === MediaAccess.ANYONE
        ? { mediaAccess: MediaAccess.ATTENDEES_ONLY }
        : {}),
    };
  }

  /** Creates an Event + EventMember (OWNER) + EventConfig in one transaction. */
  @Transactional()
  async create(
    dto: CreateEventDto,
    owner: SafeUser,
  ): Promise<EventWithMembersPayload> {
    const endAt = this.computeEndAt(dto.startAt, dto.duration);

    const event = await this.db.event.create({
      data: {
        title: dto.title,
        startAt: dto.startAt,
        endAt,
        duration: dto.duration,
        timezone: dto.timezone,
        ...defined({
          description: dto.description,
          location: dto.location,
          latitude: dto.latitude,
          longitude: dto.longitude,
          eventType: dto.eventType,
        }),
        staff: {
          create: { userId: owner.id, role: EventRole.OWNER },
        },
        config: {
          create: {
            attendeeAccess: 'ATTENDEES_ONLY',
            mediaAccess: 'ATTENDEES_ONLY',
            registrationsEnabled: true,
            prizesEnabled: true,
          },
        },
      },
      include: eventWithMembersInclude,
    });

    await this.abilityCache.del(owner.id);

    return event;
  }

  async findById(id: string): Promise<EventDetailPayload> {
    const event = await this.db.event.findUnique({
      where: { id },
      include: eventDetailInclude,
    });

    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    return event;
  }

  // CHECKME: Check if this needs to be used.
  // I think we should check if the event is public or if the user is a member in the controller instead and then call findById for simplicity.
  async findPublic(id: string): Promise<EventPublicPayload> {
    const event = await this.db.event.findUnique({
      where: { id },
      include: eventPublicInclude,
    });

    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    return event;
  }

  async findMine(userId: string) {
    const events = await this.db.event.findMany({
      where: {
        OR: [
          {
            staff: {
              some: {
                userId,
                role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
              },
            },
          },
          {
            attendees: {
              some: { userId, status: AttendeeStatus.CONFIRMED },
            },
          },
        ],
      },
      include: {
        config: true,
        _count: { select: { attendees: true } },
        staff: { where: { userId }, select: { role: true } },
      },
      orderBy: eventDefaultOrderBy,
    });

    return events.map(({ staff, ...event }) => ({
      ...event,
      myRole: (staff[0]?.role as EventRole) ?? 'ATTENDEE',
    }));
  }

  @Transactional()
  async update(id: string, dto: UpdateEventDto): Promise<EventDetailPayload> {
    const existing = await this.db.event.findUnique({
      where: { id },
      select: {
        startAt: true,
        duration: true,
        status: true,
        title: true,
        eventType: true,
        maxAttendees: true,
        config: {
          select: {
            attendeeAccess: true,
            mediaAccess: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });
    }

    assertEventStatus(existing.status, ...CONFIG_EDITABLE_STATUSES);

    const isFullyEditable = isFullyEditableStatus(existing.status);

    // Build a clean DTO that only includes fields allowed for the current status.
    // This prevents 400 errors when the frontend sends unchanged values.
    const cleanDto: UpdateEventDto = {};

    // Fields allowed in all CONTENT_EDITABLE_STATUSES (DRAFT, PUBLISHED, RESCHEDULED)
    if (dto.title !== undefined) cleanDto.title = dto.title;
    if (dto.description !== undefined) cleanDto.description = dto.description;
    if (dto.location !== undefined) cleanDto.location = dto.location;
    if (dto.latitude !== undefined) cleanDto.latitude = dto.latitude;
    if (dto.longitude !== undefined) cleanDto.longitude = dto.longitude;
    if (dto.timezone !== undefined) cleanDto.timezone = dto.timezone;
    if (dto.startAt !== undefined) cleanDto.startAt = dto.startAt;
    if (dto.duration !== undefined) cleanDto.duration = dto.duration;

    // Fields only allowed in FULLY_EDITABLE_STATUSES (DRAFT)
    if (isFullyEditable) {
      if (dto.eventType !== undefined) cleanDto.eventType = dto.eventType;
      if (dto.maxAttendees !== undefined) {
        const confirmedCount = await this.db.eventAttendee.count({
          where: { eventId: id, status: AttendeeStatus.CONFIRMED },
        });
        if (dto.maxAttendees !== null && dto.maxAttendees < confirmedCount) {
          throw new BadRequestException({
            code: ErrorCode.EVENT_STATUS_NOT_ALLOWED,
          });
        }
        cleanDto.maxAttendees = dto.maxAttendees;
      }
    }

    dto = cleanDto;

    // After cleaning, check if there's actually anything to update
    if (Object.keys(dto).length === 0) {
      // Nothing to update, return existing event
      return this.db.event.findUnique({
        where: { id },
        include: eventDetailInclude,
      }) as Promise<EventDetailPayload>;
    }

    const startAtChanged =
      dto.startAt && dto.startAt.getTime() !== existing.startAt.getTime();
    const durationChanged =
      dto.duration !== undefined && dto.duration !== existing.duration;

    const newStartAt = dto.startAt ?? existing.startAt;
    const newDuration = dto.duration ?? existing.duration;
    const nextEventType = dto.eventType ?? existing.eventType;
    const endAt =
      startAtChanged || durationChanged
        ? this.computeEndAt(newStartAt, newDuration)
        : undefined;

    // Auto-set RESCHEDULED when date changes on a published event
    let status = existing.status;
    const wasRescheduled = startAtChanged && existing.status === EventStatus.PUBLISHED;
    if (wasRescheduled) {
      status = EventStatus.RESCHEDULED;
    }

    const normalizedConfig = this.normalizePrivateEventAccess(nextEventType, {
      attendeeAccess: existing.config?.attendeeAccess,
      mediaAccess: existing.config?.mediaAccess,
    });

    const shouldNormalizeConfig =
      normalizedConfig.attendeeAccess !== existing.config?.attendeeAccess ||
      normalizedConfig.mediaAccess !== existing.config?.mediaAccess;

    const updated = await this.db.event.update({
      where: { id },
      data: {
        ...defined(dto),
        ...(endAt ? { endAt } : {}),
        status,
        ...(shouldNormalizeConfig
          ? {
              config: {
                update: defined({
                  attendeeAccess: normalizedConfig.attendeeAccess,
                  mediaAccess: normalizedConfig.mediaAccess,
                }),
              },
            }
          : {}),
      },
      include: eventDetailInclude,
    });

    // Reschedule auto-ACTIVE if startAt changed on a published/rescheduled event
    if (startAtChanged) {
      const scheduledStatuses: EventStatus[] = [
        EventStatus.PUBLISHED,
        EventStatus.RESCHEDULED,
      ];
      if (scheduledStatuses.includes(existing.status)) {
        await this.transitionsQueue.scheduleAutoActive(id, newStartAt);
      }
      // Reschedule auto-ENDED if event is already active and endAt changed
      if (existing.status === EventStatus.ACTIVE && endAt) {
        await this.transitionsQueue.scheduleAutoEnded(id, endAt);
      }
    } else if (
      durationChanged &&
      existing.status === EventStatus.ACTIVE &&
      endAt
    ) {
      await this.transitionsQueue.scheduleAutoEnded(id, endAt);
    }

    // Send notification to attendees if event was rescheduled
    if (wasRescheduled) {
      await this.notificationsService.createForAttendees(
        id,
        NotificationType.EVENT_RESCHEDULED,
        'notifications:types.EVENT_RESCHEDULED',
        'notifications:messages.eventRescheduled',
        {
          eventId: id,
          eventTitle: existing.title,
          oldDate: existing.startAt.toISOString(),
          newDate: newStartAt.toISOString(),
        },
      );
    }

    return updated;
  }

  @Transactional()
  async updateStatus(id: string, dto: UpdateEventStatusDto) {
    const event = await this.db.event.findUnique({
      where: { id },
      select: { status: true, startAt: true, endAt: true, timezone: true, title: true },
    });

    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    assertValidTransition(event.status, dto.status);

    const now = DateTime.utc();

    const startAt = DateTime.fromJSDate(event.startAt, { zone: 'utc' });

    if (
      dto.status === EventStatus.PUBLISHED &&
      startAt.toMillis() <= now.toMillis()
    ) {
      throw new BadRequestException({ code: ErrorCode.EVENT_START_IN_PAST });
    }

    const extra: Record<string, Date> = {};

    if (dto.status === EventStatus.ACTIVE) {
      extra['startedAt'] = now.toJSDate();
    } else if (dto.status === EventStatus.ENDED) {
      extra['endedAt'] = now.toJSDate();
    }

    const updated = await this.db.event.update({
      where: { id },
      data: { status: dto.status, ...extra },
    });

    // Invalidate abilities for all staff — status change affects CASL rules
    const members = await this.db.eventStaff.findMany({
      where: { eventId: id },
      select: { userId: true },
    });
    await this.abilityCache.delMany(members.map((m) => m.userId));

    // Schedule / cancel BullMQ jobs based on the new status
    await this.syncJobsAfterStatusChange(id, dto.status, event);

    if (dto.status === EventStatus.CANCELLED) {
      await this.notificationsService.createForAttendees(
        id,
        NotificationType.EVENT_CANCELLED,
        'notifications:types.EVENT_CANCELLED',
        'notifications:messages.eventCancelled',
        { eventId: id, eventTitle: event.title },
      );
    }

    return updated;
  }

  private async syncJobsAfterStatusChange(
    id: string,
    newStatus: EventStatus,
    event: { startAt: Date; endAt: Date },
  ): Promise<void> {
    for (const action of TRANSITION_JOB_ACTIONS[newStatus]) {
      switch (action) {
        case 'schedule-auto-active':
          await this.transitionsQueue.scheduleAutoActive(id, event.startAt);
          break;
        case 'schedule-auto-ended':
          await this.transitionsQueue.scheduleAutoEnded(id, event.endAt);
          break;
        case 'cancel-auto-active':
          await this.transitionsQueue.cancelAutoActive(id);
          break;
        case 'cancel-auto-ended':
          await this.transitionsQueue.cancelAutoEnded(id);
          break;
      }
    }
  }

  async updateConfig(id: string, dto: UpdateEventConfigDto) {
    await requireEventStatus(this.db, id, ...CONFIG_EDITABLE_STATUSES);

    const event = await this.db.event.findUnique({
      where: { id },
      select: { eventType: true },
    });
    if (!event) {
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });
    }

    const normalizedDto = this.normalizePrivateEventAccess(
      event.eventType,
      dto,
    );

    const result = await this.db.eventConfig.update({
      where: { eventId: id },
      data: defined(normalizedDto),
    });
    // Invalidate abilities for all event staff - config gates affect ORGANIZER rules
    const members = await this.db.eventStaff.findMany({
      where: { eventId: id },
      select: { userId: true },
    });

    await this.abilityCache.delMany(members.map((m) => m.userId));

    return result;
  }

  @Transactional()
  async setCoverImage(id: string, s3Key: string) {
    await requireEventStatus(this.db, id, ...CONFIG_EDITABLE_STATUSES);
    return this.db.event.update({ where: { id }, data: { coverImage: s3Key } });
  }

  @Transactional()
  async delete(id: string): Promise<void> {
    const event = await this.db.event.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });
    assertEventStatus(event.status, EventStatus.DRAFT, EventStatus.CANCELLED);

    const members = await this.db.eventStaff.findMany({
      where: { eventId: id },
      select: { userId: true },
    });

    await this.abilityCache.delMany(members.map((m) => m.userId));

    await this.db.event.delete({ where: { id } });
  }
}
