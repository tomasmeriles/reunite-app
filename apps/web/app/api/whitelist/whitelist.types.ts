export interface WhitelistEntry {
  id: string;
  eventId: string;
  userId: string;
  addedAt: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
    email: string;
  };
}

export interface AddToWhitelistDto {
  username: string;
}
