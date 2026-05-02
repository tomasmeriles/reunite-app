import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import { EventRole, EventStatus } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { requireEventStatus } from '../../../common/helpers/event-status.helper';
import type { AddToWhitelistDto } from '../dto/add-to-whitelist.dto';

@Injectable()
export class WhitelistService extends TransactionalService {
  @Transactional()
  async add(eventId: string, dto: AddToWhitelistDto, requesterId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );
    await this.assertOrganizer(eventId, requesterId);

    const user = await this.db.user.findUnique({
      where: { username: dto.username },
      select: { id: true, username: true, name: true, avatar: true },
    });
    if (!user) throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND });

    const existing = await this.db.eventWhitelistEntry.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing) throw new ConflictException({ code: ErrorCode.ALREADY_ON_WHITELIST });

    const entry = await this.db.eventWhitelistEntry.create({
      data: { eventId, userId: user.id, status: 'WAITLISTED' },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
    });

    return entry;
  }

  async findByEvent(eventId: string, requesterId: string) {
    await this.assertOrganizer(eventId, requesterId);
    return this.db.eventWhitelistEntry.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Transactional()
  async remove(eventId: string, entryId: string, requesterId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    );
    await this.assertOrganizer(eventId, requesterId);
    const entry = await this.db.eventWhitelistEntry.findFirst({
      where: { id: entryId, eventId },
    });
    if (!entry) throw new NotFoundException({ code: ErrorCode.WHITELIST_ENTRY_NOT_FOUND });
    await this.db.eventWhitelistEntry.delete({ where: { id: entryId } });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const member = await this.db.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!member) throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
  }
}
