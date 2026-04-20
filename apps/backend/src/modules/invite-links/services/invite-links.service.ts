import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import type { CreateInviteLinkDto } from '../dto/create-invite-link.dto';

@Injectable()
export class InviteLinksService extends TransactionalService {
  @Transactional()
  async create(eventId: string, dto: CreateInviteLinkDto, userId: string) {
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
    await this.assertOrganizer(eventId, userId);
    const link = await this.db.inviteLink.findFirst({
      where: { id: linkId, eventId },
    });
    if (!link) throw new NotFoundException('Invite link not found');
    await this.db.inviteLink.delete({ where: { id: linkId } });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const member = await this.db.tenantMember.findFirst({
      where: {
        userId,
        tenant: { event: { id: eventId } },
        role: { in: [TenantRole.OWNER, TenantRole.ADMIN] },
      },
    });
    if (!member) throw new ForbiddenException('Not an organizer of this event');
  }
}
