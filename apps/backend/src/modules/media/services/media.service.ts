import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import {
  AttendeeStatus,
  EventRole,
  EventStatus,
  EventType,
  MediaAccess,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { StorageService } from '../../../storage/services/storage.service';
import { ImageProcessingService } from '../../../storage/services/image-processing.service';
import { assertEventStatus } from '../../../common/helpers/event-status.helper';
import { paginate } from '../../../common/helpers/prisma.helpers';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const THUMBNAIL_WIDTH = 400;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  async upload(
    eventId: string,
    requester: { userId?: string; guestToken?: string },
    file: Express.Multer.File,
    caption?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { config: true },
    });
    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    const mediaAccess = event.config?.mediaAccess ?? MediaAccess.ATTENDEES_ONLY;

    if (mediaAccess === MediaAccess.DISABLED) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }

    let uploaderData: { attendeeId?: string; uploadedByUserId?: string };

    // Access check BEFORE status check — don't leak event status to unauthorized callers
    if (mediaAccess === MediaAccess.ORGANIZERS_ONLY) {
      if (!requester.userId)
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
      await this.assertOrganizer(eventId, requester.userId);
      uploaderData = { uploadedByUserId: requester.userId };
    } else {
      // ATTENDEES_ONLY or ANYONE — confirmed attendee required to upload
      const attendee = await this.prisma.eventAttendee.findFirst({
        where: requester.userId
          ? {
              userId: requester.userId,
              eventId,
              status: AttendeeStatus.CONFIRMED,
            }
          : {
              guestToken: requester.guestToken,
              eventId,
              status: AttendeeStatus.CONFIRMED,
            },
      });
      if (!attendee)
        throw new ForbiddenException({ code: ErrorCode.NOT_ATTENDING });
      uploaderData = { attendeeId: attendee.id };
    }

    // Authorized callers get the real status error
    assertEventStatus(event.status, EventStatus.ACTIVE);

    const base = `events/${eventId}/media/${randomUUID()}`;

    const fullBuffer = await this.imageProcessing.toWebP(file.buffer, {
      width: 1920,
      quality: 85,
    });
    const s3Key = `${base}/full.webp`;
    await this.storage.upload(s3Key, fullBuffer, { contentType: 'image/webp' });

    const thumbBuffer = await this.imageProcessing.toWebP(file.buffer, {
      width: THUMBNAIL_WIDTH,
      quality: 70,
    });
    const thumbnailKey = `${base}/thumb.webp`;
    await this.storage.upload(thumbnailKey, thumbBuffer, {
      contentType: 'image/webp',
    });

    return this.prisma.mediaItem.create({
      data: {
        eventId,
        ...uploaderData,
        s3Key,
        thumbnailKey,
        ...(caption && { caption }),
      },
    });
  }

  async findByEvent(
    eventId: string,
    requester: { userId?: string; guestToken?: string },
    query: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { config: true },
    });
    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    const mediaAccess = event.config?.mediaAccess ?? MediaAccess.ATTENDEES_ONLY;

    if (mediaAccess === MediaAccess.DISABLED) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }

    const isPublicEvent = event.eventType === EventType.PUBLIC;

    // Access check BEFORE status check — don't leak event status to unauthorized callers
    if (!(mediaAccess === MediaAccess.ANYONE && isPublicEvent)) {
      await this.assertCanView(eventId, requester, mediaAccess);
    }

    // Authorized callers get the real status error
    assertEventStatus(event.status, EventStatus.ACTIVE, EventStatus.ENDED);

    return paginate(
      query,
      async () => {
        const items = await this.prisma.mediaItem.findMany({
          where: { eventId },
          include: {
            attendee: {
              select: {
                id: true,
                guestName: true,
                userId: true,
                guestToken: true,
                user: { select: { name: true, username: true } },
              },
            },
            uploader: { select: { id: true, name: true, username: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: query.skip,
          take: query.limit,
        });
        return Promise.all(
          items.map(async (item) => {
            const uploaderUserId =
              item.uploadedByUserId ?? item.attendee?.userId ?? null;
            const isOwn = requester.userId
              ? uploaderUserId === requester.userId
              : !!requester.guestToken &&
                item.attendee?.guestToken === requester.guestToken;
            const uploaderName =
              item.uploader?.name ??
              item.uploader?.username ??
              item.attendee?.user?.name ??
              item.attendee?.user?.username ??
              item.attendee?.guestName ??
              null;
            return {
              ...item,
              uploadedByUserId: uploaderUserId,
              uploaderName,
              isOwn,
              url: await this.storage.getPresignedUrl(item.s3Key),
              thumbnailUrl: item.thumbnailKey
                ? await this.storage.getPresignedUrl(item.thumbnailKey)
                : null,
            };
          }),
        );
      },
      () => this.prisma.mediaItem.count({ where: { eventId } }),
    );
  }

  private async assertCanView(
    eventId: string,
    requester: { userId?: string; guestToken?: string },
    mediaAccess: MediaAccess,
  ) {
    // Staff can always view (DISABLED is already blocked before this call)
    if (requester.userId) {
      const isStaff = await this.prisma.eventStaff.findFirst({
        where: { userId: requester.userId, eventId },
      });
      if (isStaff) return;
    }

    if (mediaAccess === MediaAccess.ORGANIZERS_ONLY) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }

    // ATTENDEES_ONLY or ANYONE on private event — require confirmed attendance
    if (!requester.userId && !requester.guestToken) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }
    const attendee = await this.prisma.eventAttendee.findFirst({
      where: requester.userId
        ? {
            userId: requester.userId,
            eventId,
            status: AttendeeStatus.CONFIRMED,
          }
        : {
            guestToken: requester.guestToken,
            eventId,
            status: AttendeeStatus.CONFIRMED,
          },
    });
    if (!attendee) throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
  }

  async delete(
    eventId: string,
    itemId: string,
    requester: { userId?: string; guestToken?: string },
  ) {
    const item = await this.prisma.mediaItem.findFirst({
      where: { id: itemId, eventId },
      include: { attendee: true },
    });
    if (!item) throw new NotFoundException({ code: ErrorCode.MEDIA_NOT_FOUND });

    const uploaderUserId = item.uploadedByUserId ?? item.attendee?.userId;
    const isUserUploader =
      !!requester.userId && uploaderUserId === requester.userId;
    const isGuestUploader =
      !!requester.guestToken &&
      item.attendee?.guestToken === requester.guestToken;

    if (!isUserUploader && !isGuestUploader) {
      if (!requester.userId)
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
      await this.assertOrganizer(eventId, requester.userId);
    }

    await Promise.all([
      this.storage.delete(item.s3Key),
      item.thumbnailKey
        ? this.storage.delete(item.thumbnailKey)
        : Promise.resolve(),
    ]);

    await this.prisma.mediaItem.delete({ where: { id: itemId } });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const member = await this.prisma.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!member) throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
  }
}
