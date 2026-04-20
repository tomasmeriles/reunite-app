import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { BaseGateway } from '../../../rtc/base/base.gateway';
import { RtcAuthMiddleware } from '../../../rtc/middleware/rtc-auth.middleware';
import type { RtcSocket } from '../../../rtc/interfaces/rtc-socket.interface';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway extends BaseGateway implements OnGatewayInit {
  constructor(
    private readonly chat: ChatService,
    private readonly rtcAuth: RtcAuthMiddleware,
  ) {
    super();
  }

  afterInit(server: Server): void {
    server.use(this.rtcAuth.middleware());
    this.logger.log('ChatGateway initialized');
  }

  /** Join a chat room for an event. */
  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() socket: RtcSocket,
    @MessageBody() payload: { eventId: string },
  ) {
    await this.joinRoom(socket, `chat:${payload.eventId}`);
    const history = await this.chat.getHistory(payload.eventId);
    socket.emit('chat:history', history);
  }

  /** Send a message to an event chat room. */
  @SubscribeMessage('chat:send')
  async handleMessage(
    @ConnectedSocket() socket: RtcSocket,
    @MessageBody() payload: { eventId: string; content: string },
  ) {
    const attendeeId = this.getAttendeeId(socket);
    if (!attendeeId) {
      socket.emit('chat:error', {
        message: 'Must be a confirmed attendee to send messages',
      });
      return;
    }

    const trimmed = payload.content?.trim();
    if (!trimmed || trimmed.length > 1000) {
      socket.emit('chat:error', {
        message: 'Message must be between 1 and 1000 characters',
      });
      return;
    }

    const message = await this.chat.saveMessage(
      payload.eventId,
      attendeeId,
      trimmed,
    );
    this.broadcastToRoom(`chat:${payload.eventId}`, 'chat:message', message);
  }

  /** Fetch older messages (cursor-based pagination). */
  @SubscribeMessage('chat:history')
  async handleHistory(
    @ConnectedSocket() socket: RtcSocket,
    @MessageBody() payload: { eventId: string; cursor?: string },
  ) {
    const history = await this.chat.getHistory(payload.eventId, payload.cursor);
    socket.emit('chat:history', history);
  }
}
