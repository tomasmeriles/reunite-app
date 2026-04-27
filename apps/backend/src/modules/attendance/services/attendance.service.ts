import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendeeStatus, EventStatus, EventType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import type { RegisterAttendeeDto } from '../dto/register-attendee.dto';

@Injectable()
export class AttendanceService extends TransactionalService {
  /**
   * Registers a person for an event.
   * Handles all three EventType flows.
   * Returns the attendee record. For guests, also returns guestToken in the response.
   */
  @Transactional()
  async register(eventId: string, dto: RegisterAttendeeDto, user?: SafeUser) {
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      include: { config: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status === EventStatus.DRAFT) {
      throw new BadRequestException(
        'This event is not yet open for registration',
      );
    }
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('This event has been cancelled');
    }
    if (event.status === EventStatus.ENDED) {
      throw new BadRequestException('This event has already ended');
    }

    // Check capacity
    if (event.maxAttendees !== null) {
      const count = await this.db.eventAttendee.count({
        where: { eventId, status: AttendeeStatus.CONFIRMED },
      });
      if (count >= event.maxAttendees) {
        return this.createWaitlisted(eventId, user, dto);
      }
    }

    switch (event.eventType) {
      case EventType.PUBLIC:
        return this.registerPublic(eventId, dto, user);
      case EventType.INVITE_LINK:
        return this.registerWithLink(eventId, dto, user);
      case EventType.INVITE_ACCOUNT:
        return this.registerWithAccount(eventId, user);
      default:
        throw new BadRequestException('Unknown event type');
    }
  }

  /** Unregister (cancel) own attendance */
  @Transactional()
  async unregister(eventId: string, user?: SafeUser, guestToken?: string) {
    const where = user
      ? { eventId_userId: { eventId, userId: user.id } }
      : guestToken
        ? { guestToken }
        : null;

    if (!where) throw new BadRequestException('No identity provided');

    const attendee = await this.db.eventAttendee.findUnique({
      where: where as any,
    });
    if (!attendee) throw new NotFoundException('Registration not found');

    await this.db.eventAttendee.update({
      where: { id: attendee.id },
      data: { status: AttendeeStatus.CANCELLED },
    });
  }

  async findAttendees(eventId: string) {
    return this.db.eventAttendee.findMany({
      where: { eventId, status: AttendeeStatus.CONFIRMED },
      orderBy: { registeredAt: 'asc' },
    });
  }

  async findMyAttendance(
    eventId: string,
    user?: SafeUser,
    guestToken?: string,
  ) {
    if (user) {
      return this.db.eventAttendee.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
      });
    }
    if (guestToken) {
      return this.db.eventAttendee.findUnique({ where: { guestToken } });
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Private registration flows
  // ---------------------------------------------------------------------------

  private async registerPublic(
    eventId: string,
    dto: RegisterAttendeeDto,
    user?: SafeUser,
  ) {
    if (user) {
      // Check for duplicate
      const existing = await this.db.eventAttendee.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
      });
      if (existing && existing.status === AttendeeStatus.CONFIRMED) {
        throw new ConflictException('Already registered for this event');
      }
      if (existing) {
        return this.db.eventAttendee.update({
          where: { id: existing.id },
          data: { status: AttendeeStatus.CONFIRMED },
        });
      }
      return this.db.eventAttendee.create({
        data: { eventId, userId: user.id, status: AttendeeStatus.CONFIRMED },
      });
    }

    // Guest flow
    if (!dto.guestName?.trim()) {
      throw new BadRequestException(
        'guestName is required for guest registrations',
      );
    }
    const guestToken = randomUUID();
    const attendee = await this.db.eventAttendee.create({
      data: {
        eventId,
        guestName: dto.guestName.trim(),
        guestToken,
        status: AttendeeStatus.CONFIRMED,
      },
    });
    return { ...attendee, guestToken }; // expose token only on creation
  }

  private async registerWithLink(
    eventId: string,
    dto: RegisterAttendeeDto,
    user?: SafeUser,
  ) {
    if (!dto.inviteToken) {
      throw new BadRequestException('inviteToken is required for this event');
    }

    const link = await this.db.inviteLink.findUnique({
      where: { token: dto.inviteToken },
      select: {
        id: true,
        eventId: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
      },
    });

    if (!link || link.eventId !== eventId) {
      throw new BadRequestException('Invalid invite link');
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException('This invite link has expired');
    }
    if (link.maxUses !== null && link.usedCount >= link.maxUses) {
      throw new BadRequestException(
        'This invite link has reached its maximum uses',
      );
    }

    await this.db.inviteLink.update({
      where: { id: link.id },
      data: { usedCount: { increment: 1 } },
    });

    // Reuse public flow after validation
    const result = await this.registerPublic(eventId, dto, user);
    // Attach link reference
    await this.db.eventAttendee.update({
      where: { id: (result as any).id },
      data: { inviteLinkId: link.id },
    });
    return result;
  }

  private async registerWithAccount(eventId: string, user?: SafeUser) {
    if (!user) {
      throw new ForbiddenException(
        'An account is required to register for this event',
      );
    }

    const entry = await this.db.eventWhitelistEntry.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });

    if (!entry) {
      throw new ForbiddenException(
        'You are not on the guest list for this event',
      );
    }

    // Mark whitelist entry as accepted
    await this.db.eventWhitelistEntry.update({
      where: { id: entry.id },
      data: { status: AttendeeStatus.CONFIRMED },
    });

    const existing = await this.db.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && existing.status === AttendeeStatus.CONFIRMED) {
      throw new ConflictException('Already registered for this event');
    }
    if (existing) {
      return this.db.eventAttendee.update({
        where: { id: existing.id },
        data: { status: AttendeeStatus.CONFIRMED },
      });
    }
    return this.db.eventAttendee.create({
      data: { eventId, userId: user.id, status: AttendeeStatus.CONFIRMED },
    });
  }

  private async createWaitlisted(
    eventId: string,
    user?: SafeUser,
    dto?: RegisterAttendeeDto,
  ) {
    if (user) {
      return this.db.eventAttendee.create({
        data: { eventId, userId: user.id, status: AttendeeStatus.WAITLISTED },
      });
    }
    const guestToken = randomUUID();
    const attendee = await this.db.eventAttendee.create({
      data: {
        eventId,
        guestName: dto?.guestName?.trim(),
        guestToken,
        status: AttendeeStatus.WAITLISTED,
      },
    });
    return { ...attendee, guestToken };
  }
}
