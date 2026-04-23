import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRole, EventStatus } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { defined } from '../../../common/helpers/prisma.helpers';
import { AbilityCacheService } from '../../../casl/services/ability-cache.service';
import type { SafeUser } from '../../users/selects/user.select';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import type { UpdateEventConfigDto } from '../dto/update-event-config.dto';
import type { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { eventDefaultOrderBy } from '../constants/event.constants';
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

@Injectable()
export class EventsService extends TransactionalService {
  @Inject(AbilityCacheService)
  private readonly abilityCache!: AbilityCacheService;
  /** Creates an Event + EventMember (OWNER) + EventConfig in one transaction. */
  @Transactional()
  async create(
    dto: CreateEventDto,
    owner: SafeUser,
  ): Promise<EventWithMembersPayload> {
    const event = await this.db.event.create({
      data: {
        title: dto.title,
        startAt: dto.startAt,
        timezone: dto.timezone,
        ...defined({
          description: dto.description,
          location: dto.location,
          latitude: dto.latitude,
          longitude: dto.longitude,
          endAt: dto.endAt,
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
  async update(
    id: string,
    dto: UpdateEventDto,
    userId: string,
  ): Promise<EventDetailPayload> {
    await this.assertOwnerOrOrganizer(id, userId);

    const existing = await this.db.event.findUnique({
      where: { id },
      select: { startAt: true, status: true },
    });
    if (!existing) throw new NotFoundException('Event not found');

    // Auto-set RESCHEDULED when date changes on a published event
    let status = existing.status;
    if (
      dto.startAt &&
      dto.startAt.getTime() !== existing.startAt.getTime() &&
      existing.status === EventStatus.PUBLISHED
    ) {
      status = EventStatus.RESCHEDULED;
    }

    return this.db.event.update({
      where: { id },
      data: {
        ...defined(dto),
        status,
      },
      include: eventDetailInclude,
    });
  }

  @Transactional()
  async updateStatus(id: string, dto: UpdateEventStatusDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.db.event.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async updateConfig(id: string, dto: UpdateEventConfigDto, userId: string) {
    await this.assertOwnerOrOrganizer(id, userId);
    const result = await this.db.eventConfig.update({
      where: { eventId: id },
      data: dto,
    });
    // Invalidate abilities for all event staff — config gates affect ORGANIZER rules
    const members = await this.db.eventStaff.findMany({
      where: { eventId: id },
      select: { userId: true },
    });
    await Promise.all(members.map((m) => this.abilityCache.del(m.userId)));
    return result;
  }

  @Transactional()
  async setCoverImage(id: string, s3Key: string, userId: string) {
    await this.assertOwnerOrOrganizer(id, userId);
    return this.db.event.update({ where: { id }, data: { coverImage: s3Key } });
  }

  @Transactional()
  async delete(id: string, userId: string): Promise<void> {
    await this.assertOwner(id, userId);
    await this.db.event.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertOwnerOrOrganizer(eventId: string, userId: string) {
    const member = await this.db.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!member) throw new ForbiddenException('Not an organizer of this event');
  }

  private async assertOwner(eventId: string, userId: string) {
    const member = await this.db.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: EventRole.OWNER,
      },
    });
    if (!member)
      throw new ForbiddenException(
        'Only the event owner can perform this action',
      );
  }
}
