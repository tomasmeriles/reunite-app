import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRole, EventStatus } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { requireEventStatus } from '../../../common/helpers/event-status.helper';
import type { CreateInviteLinkDto } from '../dto/create-invite-link.dto';

@Injectable()
export class InviteLinksService extends TransactionalService {
  @Transactional()
  async create(eventId: string, dto: CreateInviteLinkDto, userId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );
    await this.assertOrganizer(eventId, userId);
    return this.db.inviteLink.create({
      data: {
        eventId,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        note: dto.note,
      },
    });
  }

  async findByEvent(eventId: string, userId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
      EventStatus.ENDED,
    );
    await this.assertOrganizer(eventId, userId);
    return this.db.inviteLink.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Public endpoint — validates a token and returns the event info (no auth needed). */
  async resolveToken(token: string) {
    const link = await this.db.inviteLink.findUnique({
      where: { token },
      include: {
        event: {
          include: {
            config: true,
            _count: {
              select: { attendees: { where: { status: 'CONFIRMED' } } },
            },
          },
        },
      },
    });
    if (!link) throw new NotFoundException('Invite link not found');

    const usableStatuses: EventStatus[] = [
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    ];
    if (!usableStatuses.includes(link.event.status)) {
      throw new NotFoundException('This invite link is not available');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException('This invite link has expired');
    }
    if (link.maxUses !== null && link.usedCount >= link.maxUses) {
      throw new NotFoundException(
        'This invite link has reached its maximum uses',
      );
    }
    return { link, event: link.event };
  }

  @Transactional()
  async delete(eventId: string, linkId: string, userId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );
    await this.assertOrganizer(eventId, userId);
    const link = await this.db.inviteLink.findFirst({
      where: { id: linkId, eventId },
    });
    if (!link) throw new NotFoundException('Invite link not found');
    await this.db.inviteLink.delete({ where: { id: linkId } });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const member = await this.db.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!member) throw new ForbiddenException('Not an organizer of this event');
  }
}
