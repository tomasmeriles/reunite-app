import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendeeStatus, EventRole, EventStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { requireEventStatus } from '../../../common/helpers/event-status.helper';
import type { CreatePrizeDto } from '../dto/create-prize.dto';
import type { AssignWinnerDto } from '../dto/assign-winner.dto';

@Injectable()
export class PrizesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eventId: string, dto: CreatePrizeDto, userId: string) {
    await requireEventStatus(
      this.prisma,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    );
    await this.assertOrganizer(eventId, userId);
    return this.prisma.prize.create({ data: { eventId, ...dto } });
  }

  async findByEvent(eventId: string) {
    await requireEventStatus(
      this.prisma,
      eventId,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
      EventStatus.ENDED,
    );
    return this.prisma.prize.findMany({
      where: { eventId },
      include: {
        winner: { select: { id: true, guestName: true, userId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignWinner(
    eventId: string,
    prizeId: string,
    dto: AssignWinnerDto,
    userId: string,
  ) {
    await requireEventStatus(this.prisma, eventId, EventStatus.ACTIVE, EventStatus.ENDED);
    await this.assertOrganizer(eventId, userId);

    const prize = await this.prisma.prize.findFirst({
      where: { id: prizeId, eventId },
    });
    if (!prize) throw new NotFoundException('Prize not found');
    if (prize.winnerId)
      throw new BadRequestException('Winner already assigned');

    let attendeeId = dto.attendeeId;

    if (!attendeeId) {
      const attendees = await this.prisma.eventAttendee.findMany({
        where: { eventId, status: AttendeeStatus.CONFIRMED },
        select: { id: true },
      });
      if (attendees.length === 0) {
        throw new BadRequestException('No confirmed attendees to pick from');
      }
      attendeeId = attendees[Math.floor(Math.random() * attendees.length)]!.id;
    } else {
      const attendee = await this.prisma.eventAttendee.findFirst({
        where: { id: attendeeId, eventId, status: AttendeeStatus.CONFIRMED },
      });
      if (!attendee)
        throw new NotFoundException('Attendee not found in this event');
    }

    return this.prisma.prize.update({
      where: { id: prizeId },
      data: { winnerId: attendeeId },
      include: {
        winner: { select: { id: true, guestName: true, userId: true } },
      },
    });
  }

  async delete(eventId: string, prizeId: string, userId: string) {
    await requireEventStatus(
      this.prisma,
      eventId,
      EventStatus.DRAFT,
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
      EventStatus.ACTIVE,
    );
    await this.assertOrganizer(eventId, userId);
    const prize = await this.prisma.prize.findFirst({
      where: { id: prizeId, eventId },
    });
    if (!prize) throw new NotFoundException('Prize not found');
    await this.prisma.prize.delete({ where: { id: prizeId } });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const member = await this.prisma.eventStaff.findFirst({
      where: {
        userId,
        eventId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!member) throw new ForbiddenException('Not an organizer of this event');
  }
}
