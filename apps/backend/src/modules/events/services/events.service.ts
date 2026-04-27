import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRole, EventStatus } from '@prisma/client';
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
import { assertValidTransition } from '../helpers/event-state-machine.helper';
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
  @Inject(AbilityCacheService)
  private readonly abilityCache!: AbilityCacheService;

  @Inject(EventTransitionsQueueService)
  private readonly transitionsQueue!: EventTransitionsQueueService;

  private computeEndAt(startAt: Date, durationMinutes: number): Date {
    return DateTime.fromJSDate(startAt)
      .plus({ minutes: durationMinutes })
      .toJSDate();
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
            attendeesPublic: true,
            chatEnabled: true,
            mediaEnabled: true,
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

    if (!event) throw new NotFoundException('Event not found');

    return event;
  }

  // CHECKME: Check if this needs to be used.
  // I think we should check if the event is public or if the user is a member in the controller instead and then call findById for simplicity.
  async findPublic(id: string): Promise<EventPublicPayload> {
    const event = await this.db.event.findUnique({
      where: { id },
      include: eventPublicInclude,
    });

    if (!event) throw new NotFoundException('Event not found');

    return event;
  }

  async findMine(userId: string): Promise<EventListPayload[]> {
    return this.db.event.findMany({
      where: {
        staff: {
          some: {
            userId,
            role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
          },
        },
      },
      include: eventListInclude,
      orderBy: eventDefaultOrderBy,
    });
  }

  @Transactional()
  async update(id: string, dto: UpdateEventDto): Promise<EventDetailPayload> {
    const existing = await this.db.event.findUnique({
      where: { id },
      select: { startAt: true, duration: true, status: true },
    });

    if (!existing) throw new NotFoundException('Event not found');

    assertEventStatus(
      existing.status,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );

    const startAtChanged =
      dto.startAt && dto.startAt.getTime() !== existing.startAt.getTime();
    const durationChanged =
      dto.duration !== undefined && dto.duration !== existing.duration;

    const newStartAt = dto.startAt ?? existing.startAt;
    const newDuration = dto.duration ?? existing.duration;
    const endAt =
      startAtChanged || durationChanged
        ? this.computeEndAt(newStartAt, newDuration)
        : undefined;

    // Auto-set RESCHEDULED when date changes on a published event
    let status = existing.status;
    if (startAtChanged && existing.status === EventStatus.PUBLISHED) {
      status = EventStatus.RESCHEDULED;
    }

    const updated = await this.db.event.update({
      where: { id },
      data: {
        ...defined(dto),
        ...(endAt ? { endAt } : {}),
        status,
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

    return updated;
  }

  @Transactional()
  async updateStatus(id: string, dto: UpdateEventStatusDto) {
    const event = await this.db.event.findUnique({
      where: { id },
      select: { status: true, startAt: true, endAt: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    assertValidTransition(event.status, dto.status);

    // CHECKME: Check if we should use event timezone for this comparison.
    // Also we should use Luxon for all date handling in this service for consistency.
    const now = new Date();

    if (dto.status === EventStatus.PUBLISHED && event.startAt <= now) {
      throw new BadRequestException(
        'Start date is in the past. Update the event date before publishing.',
      );
    }
    const extra: Record<string, Date> = {};

    if (dto.status === EventStatus.ACTIVE) {
      extra['startedAt'] = now;
    } else if (dto.status === EventStatus.ENDED) {
      extra['endedAt'] = now;
    }

    const updated = await this.db.event.update({
      where: { id },
      data: { status: dto.status, ...extra },
    });

    // Schedule / cancel BullMQ jobs based on the new status
    await this.syncJobsAfterStatusChange(id, dto.status, event);

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
    await requireEventStatus(
      this.db,
      id,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    );
    const result = await this.db.eventConfig.update({
      where: { eventId: id },
      data: defined(dto),
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
    await requireEventStatus(
      this.db,
      id,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );
    return this.db.event.update({ where: { id }, data: { coverImage: s3Key } });
  }

  @Transactional()
  async delete(id: string): Promise<void> {
    const event = await this.db.event.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!event) throw new NotFoundException('Event not found');
    assertEventStatus(event.status, EventStatus.DRAFT, EventStatus.CANCELLED);

    const members = await this.db.eventStaff.findMany({
      where: { eventId: id },
      select: { userId: true },
    });

    await this.abilityCache.delMany(members.map((m) => m.userId));

    await this.db.event.delete({ where: { id } });
  }
}
