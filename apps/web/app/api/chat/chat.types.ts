export interface ChatMessage {
  id: string;
  eventId: string;
  attendeeId: string;
  body: string;
  sentAt: string;
  attendee: {
    id: string;
    guestName: string | null;
    user?: {
      id: string;
      name: string | null;
      username: string;
      avatar: string | null;
    };
  };
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  nextCursor: string | null;
}
