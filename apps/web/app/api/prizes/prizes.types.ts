export interface Prize {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  position: number;
  winnerId: string | null;
  winner?: {
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

export interface CreatePrizeDto {
  title: string;
  description?: string;
  position?: number;
}

export interface AssignWinnerDto {
  attendeeId?: string;
}
