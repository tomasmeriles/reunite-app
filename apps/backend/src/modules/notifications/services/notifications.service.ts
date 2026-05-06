import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { notificationSelect, type NotificationPayload } from '../selects/notification.select';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationsGateway } from '../gateway/notifications.gateway';

@Injectable()
export class NotificationsService extends TransactionalService {
  constructor(private readonly gateway: NotificationsGateway) {
    super();
  }

  async create(dto: CreateNotificationDto): Promise<NotificationPayload> {
    const notification = (await this.db.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data ?? Prisma.JsonNull,
      },
      select: notificationSelect,
    })) as NotificationPayload;

    // Send real-time notification
    this.gateway.sendToUser(dto.userId, notification);

    return notification;
  }

  async createForAttendees(
    eventId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Get all confirmed attendees for the event
    const attendees = await this.db.eventAttendee.findMany({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
      select: {
        userId: true,
      },
    });

    // Filter out null userIds
    const userIds = attendees
      .map((a) => a.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length > 0) {
      await this.db.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type,
          title,
          message,
          data: data ?? Prisma.JsonNull,
        })),
      });

      // Send real-time notifications using data we already have — no second DB query
      const now = new Date().toISOString();
      for (const userId of userIds) {
        this.gateway.sendToUser(userId, {
          userId,
          type,
          title,
          message,
          data: data ?? null,
          readAt: null,
          createdAt: now,
        });
      }
    }
  }

  async findMany(
    userId: string,
    opts?: { unreadOnly?: boolean },
  ): Promise<NotificationPayload[]> {
    return (await this.db.notification.findMany({
      where: {
        userId,
        ...(opts?.unreadOnly ? { readAt: null } : {}),
      },
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
    })) as NotificationPayload[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.db.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
