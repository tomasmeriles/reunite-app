import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import {
  AttendeeAccess,
  AttendeeStatus,
  EventStatus,
  EventType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { paginate } from '../../../common/helpers/prisma.helpers';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AttendeeQueryDto } from '../dto/attendee-query.dto';
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
    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });
    if (event.status === EventStatus.DRAFT) {
      throw new BadRequestException({ code: ErrorCode.REGISTRATION_CLOSED });
    }
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException({ code: ErrorCode.EVENT_CANCELLED });
    }
    if (event.status === EventStatus.ENDED) {
      throw new BadRequestException({ code: ErrorCode.EVENT_ENDED });
    }

    if (event.config?.registrationsEnabled === false) {
      throw new BadRequestException({
        code: ErrorCode.REGISTRATIONS_DISABLED,
      });
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

    // Staff (owner/organizer) bypass: skip invite token / whitelist requirements
    if (user) {
      const staffRow = await this.db.eventStaff.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
      });
      if (staffRow) return this.registerPublic(eventId, dto, user);
    }

    switch (event.eventType) {
      case EventType.PUBLIC:
        return this.registerPublic(eventId, dto, user);
      case EventType.INVITE_LINK:
        return this.registerWithLink(eventId, dto, user);
      case EventType.INVITE_ACCOUNT:
        return this.registerWithAccount(eventId, user);
      default:
        throw new BadRequestException({ code: ErrorCode.VALIDATION_ERROR });
    }
  }

  /** Staff removes an attendee from the event. */
  @Transactional()
  async removeAttendee(
    eventId: string,
    attendeeId: string,
    requestingUserId?: string,
  ) {
    const attendee = await this.db.eventAttendee.findUnique({
      where: { id: attendeeId },
    });
    if (!attendee || attendee.eventId !== eventId) {
      throw new NotFoundException({ code: ErrorCode.ATTENDEE_NOT_FOUND });
    }
    if (attendee.status === AttendeeStatus.CANCELLED) {
      throw new BadRequestException({
        code: ErrorCode.ATTENDEE_ALREADY_REMOVED,
      });
    }

    // ORGANIZER cannot remove other staff members (OWNER or ORGANIZER)
    // Only the event OWNER can remove staff attendees.
    if (attendee.userId && requestingUserId) {
      const targetStaff = await this.db.eventStaff.findUnique({
        where: { eventId_userId: { eventId, userId: attendee.userId } },
      });
      if (targetStaff) {
        const requesterStaff = await this.db.eventStaff.findUnique({
          where: { eventId_userId: { eventId, userId: requestingUserId } },
        });
        if (requesterStaff?.role !== 'OWNER') {
          throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
        }
      }
    }

    await this.db.eventAttendee.update({
      where: { id: attendeeId },
      data: { status: AttendeeStatus.CANCELLED },
    });
  }

  /** Unregister (cancel) own attendance, optionally recording a reason. */
  @Transactional()
  async unregister(
    eventId: string,
    user?: SafeUser,
    guestToken?: string,
    reason?: string,
  ) {
    const where = user
      ? { eventId_userId: { eventId, userId: user.id } }
      : guestToken
        ? { guestToken }
        : null;

    if (!where)
      throw new BadRequestException({ code: ErrorCode.NO_IDENTITY_PROVIDED });

    const attendee = await this.db.eventAttendee.findUnique({ where });
    if (!attendee)
      throw new NotFoundException({ code: ErrorCode.NOT_REGISTERED });

    await this.db.eventAttendee.update({
      where: { id: attendee.id },
      data: {
        status: AttendeeStatus.CANCELLED,
        cancellationReason: reason?.trim() || null,
      },
    });
  }

  async findAttendees(
    eventId: string,
    query: AttendeeQueryDto,
    user?: SafeUser,
    guestToken?: string,
  ) {
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      include: { config: true },
    });

    const attendeeAccess =
      event?.config?.attendeeAccess ?? AttendeeAccess.ATTENDEES_ONLY;

    if (attendeeAccess === AttendeeAccess.DISABLED) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }

    const isPublicAnyone =
      attendeeAccess === AttendeeAccess.ANYONE &&
      event?.eventType === EventType.PUBLIC;

    if (!isPublicAnyone) {
      if (user) {
        const isStaff = await this.db.eventStaff.findUnique({
          where: { eventId_userId: { eventId, userId: user.id } },
        });
        if (!isStaff) {
          if (attendeeAccess === AttendeeAccess.ORGANIZERS_ONLY) {
            throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
          }
          const isAttendee = await this.db.eventAttendee.findFirst({
            where: {
              eventId,
              userId: user.id,
              status: AttendeeStatus.CONFIRMED,
            },
          });
          if (!isAttendee)
            throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
        }
      } else if (guestToken) {
        if (attendeeAccess === AttendeeAccess.ORGANIZERS_ONLY) {
          throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
        }
        const attendee = await this.db.eventAttendee.findUnique({
          where: { guestToken },
        });
        if (
          !attendee ||
          attendee.eventId !== eventId ||
          attendee.status !== AttendeeStatus.CONFIRMED
        ) {
          throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
        }
      } else {
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
      }
    }

    const where = {
      eventId,
      status: AttendeeStatus.CONFIRMED,
      ...this.buildAttendeeSearch(query.search),
    };
    const include = {
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      sponsoredBy: {
        select: {
          id: true,
          guestName: true,
          user: { select: { name: true, username: true } },
        },
      },
    } as const;

    return paginate(
      query,
      () =>
        this.db.eventAttendee.findMany({
          where,
          orderBy: { registeredAt: 'asc' },
          skip: query.skip,
          take: query.limit,
          include,
        }),
      () => this.db.eventAttendee.count({ where }),
    );
  }

  /** Staff-only: all attendees regardless of status, includes cancellation reason. */
  async findAllAttendees(eventId: string, query: AttendeeQueryDto) {
    const where = {
      eventId,
      ...this.buildAttendeeSearch(query.search),
    };
    const include = {
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      sponsoredBy: {
        select: {
          id: true,
          guestName: true,
          user: { select: { name: true, username: true } },
        },
      },
    } as const;

    return paginate(
      query,
      () =>
        this.db.eventAttendee.findMany({
          where,
          orderBy: [{ status: 'asc' }, { registeredAt: 'asc' }],
          skip: query.skip,
          take: query.limit,
          include,
        }),
      () => this.db.eventAttendee.count({ where }),
    );
  }

  private buildAttendeeSearch(search?: string) {
    if (!search?.trim()) return {};
    const term = search.trim();
    return {
      OR: [
        { guestName: { contains: term, mode: 'insensitive' as const } },
        { user: { name: { contains: term, mode: 'insensitive' as const } } },
        {
          user: { username: { contains: term, mode: 'insensitive' as const } },
        },
      ],
    };
  }

  async findMyAttendance(
    eventId: string,
    user?: SafeUser,
    guestToken?: string,
  ) {
    const include = {
      inviteLink: { select: { maxUses: true, useCount: true } },
    } as const;
    if (user) {
      return this.db.eventAttendee.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
        include,
      });
    }
    if (guestToken) {
      return this.db.eventAttendee.findUnique({
        where: { guestToken },
        include,
      });
    }
    return null;
  }

  /** Attendee (registered or guest) adds an additional guest on their behalf. */
  @Transactional()
  async bringGuest(
    eventId: string,
    guestName: string,
    userId?: string,
    guestToken?: string,
  ) {
    if (!userId && !guestToken) {
      throw new ForbiddenException({ code: ErrorCode.NO_IDENTITY_PROVIDED });
    }

    const event = await this.db.event.findUnique({
      where: { id: eventId },
      include: { config: true },
    });
    if (!event)
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });

    if (event.eventType === EventType.INVITE_ACCOUNT) {
      throw new ForbiddenException({ code: ErrorCode.GUESTS_NOT_ALLOWED });
    }
    if (event.config?.registrationsEnabled === false) {
      throw new BadRequestException({
        code: ErrorCode.REGISTRATIONS_DISABLED,
      });
    }

    let myAttendee = userId
      ? await this.db.eventAttendee.findUnique({
          where: { eventId_userId: { eventId, userId } },
        })
      : null;

    // If authenticated user has no attendance record, fall back to guestToken
    if (!myAttendee && guestToken) {
      myAttendee = await this.db.eventAttendee.findUnique({
        where: { guestToken },
      });
    }

    if (!myAttendee || myAttendee.status !== AttendeeStatus.CONFIRMED) {
      throw new ForbiddenException({ code: ErrorCode.NOT_ATTENDING });
    }

    if (event.maxAttendees !== null) {
      const count = await this.db.eventAttendee.count({
        where: { eventId, status: AttendeeStatus.CONFIRMED },
      });
      if (count >= event.maxAttendees) {
        throw new BadRequestException({ code: ErrorCode.CAPACITY_FULL });
      }
    }

    // For INVITE_LINK events, enforce remaining uses on the link used to join
    if (myAttendee.inviteLinkId) {
      const link = await this.db.inviteLink.findUnique({
        where: { id: myAttendee.inviteLinkId },
      });
      if (link && link.maxUses !== null && link.useCount >= link.maxUses) {
        throw new ForbiddenException({ code: ErrorCode.INVITE_LINK_EXHAUSTED });
      }
      if (link) {
        await this.db.inviteLink.update({
          where: { id: link.id },
          data: { useCount: { increment: 1 } },
        });
      }
    }

    const newGuestToken = randomUUID();
    const guest = await this.db.eventAttendee.create({
      data: {
        eventId,
        guestName: guestName.trim(),
        guestToken: newGuestToken,
        status: AttendeeStatus.CONFIRMED,
        inviteLinkId: myAttendee.inviteLinkId,
        addedById: myAttendee.id,
      },
    });
    return { ...guest, guestToken: newGuestToken };
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
      const guestName = dto.guestName?.trim() || null;
      // Check for duplicate
      const existing = await this.db.eventAttendee.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
      });
      if (existing && existing.status === AttendeeStatus.CONFIRMED) {
        throw new ConflictException({ code: ErrorCode.ALREADY_REGISTERED });
      }
      if (existing) {
        return this.db.eventAttendee.update({
          where: { id: existing.id },
          data: { status: AttendeeStatus.CONFIRMED, guestName },
        });
      }
      return this.db.eventAttendee.create({
        data: {
          eventId,
          userId: user.id,
          guestName,
          status: AttendeeStatus.CONFIRMED,
        },
      });
    }

    // Guest flow
    if (!dto.guestName?.trim()) {
      throw new BadRequestException({ code: ErrorCode.GUEST_NAME_REQUIRED });
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
      throw new BadRequestException({ code: ErrorCode.INVITE_TOKEN_REQUIRED });
    }

    const link = await this.db.inviteLink.findUnique({
      where: { token: dto.inviteToken },
      select: {
        id: true,
        eventId: true,
        maxUses: true,
        useCount: true,
        expiresAt: true,
      },
    });

    if (!link || link.eventId !== eventId) {
      throw new BadRequestException({ code: ErrorCode.INVITE_LINK_INVALID });
    }
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      select: { eventType: true },
    });
    if (!event) {
      throw new NotFoundException({ code: ErrorCode.EVENT_NOT_FOUND });
    }
    if (event.eventType !== EventType.INVITE_LINK) {
      throw new BadRequestException({ code: ErrorCode.INVITE_LINK_INACTIVE });
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new BadRequestException({ code: ErrorCode.INVITE_LINK_EXPIRED });
    }
    if (link.maxUses !== null && link.useCount >= link.maxUses) {
      throw new BadRequestException({ code: ErrorCode.INVITE_LINK_EXHAUSTED });
    }

    await this.db.inviteLink.update({
      where: { id: link.id },
      data: { useCount: { increment: 1 } },
    });

    // Reuse public flow after validation
    const result = await this.registerPublic(eventId, dto, user);
    // Attach link reference
    await this.db.eventAttendee.update({
      where: { id: result.id },
      data: { inviteLinkId: link.id },
    });
    return result;
  }

  private async registerWithAccount(eventId: string, user?: SafeUser) {
    if (!user) {
      throw new ForbiddenException({ code: ErrorCode.ACCOUNT_REQUIRED });
    }

    const entry = await this.db.eventWhitelistEntry.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });

    if (!entry) {
      throw new ForbiddenException({ code: ErrorCode.NOT_INVITED });
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
