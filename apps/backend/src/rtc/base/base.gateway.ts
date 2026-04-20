import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { RtcSocket } from '../interfaces/rtc-socket.interface';

/**
 * Reusable base class for all RTC gateways.
 * Provides connection/disconnection logging and helper utilities.
 * Subclasses just implement their specific message handlers.
 */
export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  protected server!: Server;

  protected readonly logger = new Logger(this.constructor.name);

  handleConnection(socket: RtcSocket): void {
    const identity = this.resolveIdentity(socket);
    this.logger.debug(`Client connected: ${socket.id} (${identity})`);
  }

  handleDisconnect(socket: RtcSocket): void {
    const identity = this.resolveIdentity(socket);
    this.logger.debug(`Client disconnected: ${socket.id} (${identity})`);
  }

  /** Returns a human-readable identity string for logging. */
  protected resolveIdentity(socket: RtcSocket): string {
    if (socket.data?.user) return `user:${socket.data.user.id}`;
    if (socket.data?.guest) return `guest:${socket.data.guest.id}`;
    return 'anonymous';
  }

  /** Join a room by name (e.g. event ID). */
  protected async joinRoom(socket: RtcSocket, room: string): Promise<void> {
    await socket.join(room);
  }

  /** Leave a room. */
  protected async leaveRoom(socket: RtcSocket, room: string): Promise<void> {
    await socket.leave(room);
  }

  /** Broadcast an event to all sockets in a room, excluding the sender. */
  protected broadcastToRoom<T>(room: string, event: string, data: T): void {
    this.server.to(room).emit(event, data);
  }

  /**
   * Returns the attendee ID for the connected socket.
   * Returns null if the user is not identified (anonymous).
   */
  protected getAttendeeId(socket: RtcSocket): string | null {
    return socket.data?.guest?.id ?? null;
  }

  /** Returns the user ID if it's a registered user connection. */
  protected getUserId(socket: RtcSocket): string | null {
    return socket.data?.user?.id ?? null;
  }
}
