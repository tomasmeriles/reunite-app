import type { Socket } from 'socket.io';
import type { SafeUser } from '../../modules/users/selects/user.select';
import type { EventAttendee } from '@prisma/client';

/**
 * Authenticated RTC socket.
 * Either a registered user or a guest attendee is attached after the auth middleware runs.
 */
export interface RtcSocket extends Socket {
  data: {
    user?: SafeUser;
    guest?: EventAttendee;
  };
}
