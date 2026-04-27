import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';

const MESSAGE_PAGE_SIZE = 40;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(eventId: string, attendeeId: string, content: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.ACTIVE) {
      throw new ForbiddenException('Chat is only available during the live event.');
    }

    // Verify attendee belongs to this event
    const attendee = await this.prisma.eventAttendee.findFirst({
      where: { id: attendeeId, eventId, status: 'CONFIRMED' },
    });
    if (!attendee)
      throw new NotFoundException('Attendee not found in this event');

    return this.prisma.chatMessage.create({
      data: { eventId, attendeeId, content },
      include: {
        attendee: {
          select: {
            id: true,
            guestName: true,
            userId: true,
          },
        },
      },
    });
  }

  async getHistory(eventId: string, cursor?: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { eventId },
      take: MESSAGE_PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        attendee: {
          select: { id: true, guestName: true, userId: true },
        },
      },
    });
    return messages.reverse(); // return in chronological order
  }
}
