import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/services/prisma.service';
import { userSelect } from '../../modules/users/selects/user.select';
import type { RtcSocket } from '../interfaces/rtc-socket.interface';

/**
 * Middleware applied to every Socket.io connection.
 * Reads either:
 *   - `auth.token`  → JWT access token (registered user)
 *   - `auth.guestToken` → guest UUID token (anonymous attendee)
 * and attaches the resolved identity to socket.data.
 */
@Injectable()
export class RtcAuthMiddleware {
  private readonly logger = new Logger(RtcAuthMiddleware.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  middleware() {
    return async (socket: Socket, next: (err?: Error) => void) => {
      const rtcSocket = socket as RtcSocket;
      const { token, guestToken } = (socket.handshake.auth ?? {}) as {
        token?: string;
        guestToken?: string;
      };

      try {
        if (token) {
          const payload = this.jwt.verify<{ sub: string }>(token);
          const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: userSelect,
          });
          if (user) {
            rtcSocket.data.user = user;
            return next();
          }
        }

        if (guestToken) {
          const guest = await this.prisma.eventAttendee.findUnique({
            where: { guestToken },
          });
          if (guest) {
            rtcSocket.data.guest = guest;
            return next();
          }
        }

        // Allow unauthenticated connections (some namespaces are public read-only)
        return next();
      } catch (err) {
        this.logger.warn(`RTC auth error: ${(err as Error).message}`);
        return next();
      }
    };
  }
}
