import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import { AttendeeStatus, EventRole, EventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { StorageService } from '../../../storage/services/storage.service';
import { ImageProcessingService } from '../../../storage/services/image-processing.service';
import { requireEventStatus } from '../../../common/helpers/event-status.helper';

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
    attendeeId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    await requireEventStatus(this.prisma, eventId, EventStatus.ACTIVE);

    const attendee = await this.prisma.eventAttendee.findFirst({
      where: { id: attendeeId, eventId, status: AttendeeStatus.CONFIRMED },
    });
    if (!attendee)
      throw new ForbiddenException({ code: ErrorCode.NOT_ATTENDING });

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
      data: { eventId, attendeeId, s3Key, thumbnailKey, caption },
    });
  }

  async findByEvent(eventId: string) {
    await requireEventStatus(this.prisma, eventId, EventStatus.ACTIVE, EventStatus.ENDED);

    const items = await this.prisma.mediaItem.findMany({
      where: { eventId },
      include: {
        attendee: { select: { id: true, guestName: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await this.storage.getPresignedUrl(item.s3Key),
        thumbnailUrl: item.thumbnailKey
          ? await this.storage.getPresignedUrl(item.thumbnailKey)
          : null,
      })),
    );
  }

  async delete(eventId: string, itemId: string, requesterId: string) {
    const item = await this.prisma.mediaItem.findFirst({
      where: { id: itemId, eventId },
      include: { attendee: true },
    });
    if (!item) throw new NotFoundException({ code: ErrorCode.MEDIA_NOT_FOUND });

    const isUploader = item.attendee.id === requesterId;
    if (!isUploader) {
      await this.assertOrganizer(eventId, requesterId);
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
