import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Skeleton } from '~/components/ui/skeleton';
import { useAuth } from '~/contexts/auth';
import env from '~/env';
import type { ChatMessage } from '~/api/chat/chat.types';

interface ChatPanelProps {
  eventId: string;
  attendeeId: string | null;
  guestToken: string | null;
}

export function ChatPanel({ eventId, attendeeId, guestToken }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canChat = !!attendeeId;

  useEffect(() => {
    const socket = io(`${env.VITE_WS_URL}/chat`, {
      auth: {
        ...(guestToken ? { guestToken } : {}),
      },
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.emit(
      'chat:join',
      { eventId },
      (history: { messages: ChatMessage[] }) => {
        setMessages(history.messages);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, guestToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!body.trim() || !socketRef.current || !canChat) return;
    socketRef.current.emit('chat:send', { eventId, body: body.trim() });
    setBody('');
  };

  const getDisplayName = (msg: ChatMessage) =>
    msg.attendee.user?.name ?? msg.attendee.guestName ?? 'Guest';

  const getAvatar = (msg: ChatMessage) =>
    msg.attendee.user?.avatar ?? undefined;

  const getInitials = (msg: ChatMessage) =>
    getDisplayName(msg).charAt(0).toUpperCase();

  return (
    <div className="flex h-120 flex-col rounded-lg border">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Be the first to say hello! 👋
          </p>
        )}
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOwn =
              (user && msg.attendee.user?.id === user.id) ||
              (attendeeId && msg.attendeeId === attendeeId);

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={getAvatar(msg)} />
                  <AvatarFallback className="text-xs">
                    {getInitials(msg)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {!isOwn && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">
                      {getDisplayName(msg)}
                    </p>
                  )}
                  <p>{msg.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        {canChat ? (
          <div className="flex gap-2">
            <Input
              placeholder={connected ? 'Say something…' : 'Connecting…'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={!connected}
            />
            <Button onClick={sendMessage} disabled={!connected || !body.trim()}>
              Send
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Register to join the chat
          </p>
        )}
      </div>
    </div>
  );
}
