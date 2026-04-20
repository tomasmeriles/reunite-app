import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, TenantRole, TenantType } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import type { UpdateEventConfigDto } from '../dto/update-event-config.dto';
import type { UpdateEventStatusDto } from '../dto/update-event-status.dto';

@Injectable()
export class EventsService extends TransactionalService {
  /** Creates a Tenant (type=EVENT) + TenantMember (OWNER) + Event + EventConfig in one transaction. */
  @Transactional()
  async createEvent(dto: CreateEventDto, owner: SafeUser) {
    const tenant = await this.db.tenant.create({
      data: {
        name: dto.title,
        type: TenantType.EVENT,
        members: {
          create: { userId: owner.id, role: TenantRole.OWNER },
        },
      },
    });

    const event = await this.db.event.create({
      data: {
        tenantId: tenant.id,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        maxAttendees: dto.maxAttendees,
        eventType: dto.eventType,
        preEventText: dto.preEventText,
        postEventText: dto.postEventText,
        previousEventId: dto.previousEventId,
        config: {
          create: {
            attendeesPublic: true,
            chatEnabled: true,
            mediaEnabled: true,
            prizesEnabled: true,
          },
        },
      },
      include: { config: true, tenant: { include: { members: true } } },
    });

    return event;
  }

  async findById(id: string) {
    const event = await this.db.event.findUnique({
      where: { id },
      include: { config: true, rules: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findPublic(id: string) {
    const event = await this.db.event.findUnique({
      where: { id },
      include: {
        config: true,
        rules: true,
        _count: { select: { attendees: { where: { status: 'CONFIRMED' } } } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findMine(userId: string) {
    return this.db.event.findMany({
      where: {
        tenant: {
          members: {
            some: {
              userId,
              role: { in: [TenantRole.OWNER, TenantRole.ADMIN] },
            },
          },
        },
      },
      include: { config: true, _count: { select: { attendees: true } } },
      orderBy: { startAt: 'asc' },
    });
  }

  @Transactional()
  async updateEvent(id: string, dto: UpdateEventDto, userId: string) {
    await this.assertOwnerOrAdmin(id, userId);

    const existing = await this.db.event.findUnique({
      where: { id },
      select: { startAt: true, status: true },
    });
    if (!existing) throw new NotFoundException('Event not found');

    // Auto-set RESCHEDULED when date changes on a published event
    let status = existing.status;
    if (
      dto.startAt &&
      new Date(dto.startAt).getTime() !== existing.startAt.getTime() &&
      existing.status === EventStatus.PUBLISHED
    ) {
      status = EventStatus.RESCHEDULED;
    }

    return this.db.event.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        status,
      },
      include: { config: true, rules: true },
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

  @Transactional()
  async updateConfig(id: string, dto: UpdateEventConfigDto, userId: string) {
    await this.assertOwnerOrAdmin(id, userId);
    return this.db.eventConfig.update({
      where: { eventId: id },
      data: dto,
    });
  }

  @Transactional()
  async setCoverImage(id: string, s3Key: string, userId: string) {
    await this.assertOwnerOrAdmin(id, userId);
    return this.db.event.update({ where: { id }, data: { coverImage: s3Key } });
  }

  @Transactional()
  async deleteEvent(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.db.event.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertOwnerOrAdmin(eventId: string, userId: string) {
    const member = await this.db.tenantMember.findFirst({
      where: {
        userId,
        tenant: { event: { id: eventId } },
        role: { in: [TenantRole.OWNER, TenantRole.ADMIN] },
      },
    });
    if (!member) throw new ForbiddenException('Not an organizer of this event');
  }

  private async assertOwner(eventId: string, userId: string) {
    const member = await this.db.tenantMember.findFirst({
      where: {
        userId,
        tenant: { event: { id: eventId } },
        role: TenantRole.OWNER,
      },
    });
    if (!member)
      throw new ForbiddenException(
        'Only the event owner can perform this action',
      );
  }
}
