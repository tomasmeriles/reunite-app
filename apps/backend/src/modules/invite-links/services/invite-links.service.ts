import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import { EventStatus } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { requireEventStatus } from '../../../common/helpers/event-status.helper';
import { defined } from '../../../common/helpers/prisma.helpers';
import type { CreateInviteLinkDto } from '../dto/create-invite-link.dto';
import { DateTime } from 'luxon';
import { StorageService } from '../../../storage/services/storage.service';

type UnavailableReason =
  | 'draft'
  | 'expired'
  | 'max_uses_reached'
  | 'unavailable';

@Injectable()
export class InviteLinksService extends TransactionalService {
  @Inject(StorageService)
  private readonly storage!: StorageService;
  @Transactional()
  async create(eventId: string, dto: CreateInviteLinkDto) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    );
    return this.db.inviteLink.create({
      data: {
        eventId,
        ...defined(dto),
      },
    });
  }

  async findByEvent(eventId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
      EventStatus.ENDED,
    );
    return this.db.inviteLink.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Public endpoint - returns event + link info for a token. Throws 404 for unknown tokens, 422 when link is not usable. */
  async resolveToken(token: string) {
    const link = await this.db.inviteLink.findUnique({
      where: { token },
      include: { event: true },
    });

    if (!link) throw new NotFoundException({ code: ErrorCode.INVITE_LINK_NOT_FOUND });

    const { event } = link;

    let reason: UnavailableReason | undefined;

    const now = DateTime.utc();
    const usableStatuses: EventStatus[] = [
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    ];
    if (event.status === EventStatus.DRAFT) {
      reason = 'draft';
    } else if (!usableStatuses.includes(event.status)) {
      reason = 'unavailable';
    } else if (
      link.expiresAt &&
      DateTime.fromJSDate(link.expiresAt).toMillis() < now.toMillis()
    ) {
      reason = 'expired';
    } else if (link.maxUses !== null && link.useCount >= link.maxUses) {
      reason = 'max_uses_reached';
    }

    const coverImage = link.event.coverImage
      ? await this.storage.getPresignedUrl(link.event.coverImage)
      : null;

    const payload = {
      event: {
        id: link.event.id,
        title: link.event.title,
        description: link.event.description,
        coverImage,
        location: link.event.location,
        timezone: link.event.timezone,
        startDate: link.event.startAt,
        endDate: link.event.endAt,
        maxAttendees: link.event.maxAttendees,
      },
      link: {
        label: link.label,
        maxUses: link.maxUses,
        useCount: link.useCount,
        expiresAt: link.expiresAt,
      },
    };

    if (reason !== undefined) {
      throw new UnprocessableEntityException({ reason, ...payload });
    }

    return payload;
  }

  @Transactional()
  async delete(eventId: string, linkId: string) {
    await requireEventStatus(
      this.db,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    );

    const link = await this.db.inviteLink.findFirst({
      where: { id: linkId, eventId },
    });

    if (!link) throw new NotFoundException({ code: ErrorCode.INVITE_LINK_NOT_FOUND });

    await this.db.inviteLink.delete({ where: { id: linkId } });
  }
}
