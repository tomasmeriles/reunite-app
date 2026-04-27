import {
  OAuthProvider,
  type EventConfig,
  type EventStaff,
  type EventStatus,
} from '@prisma/client';
import type { SafeUser } from '../selects/user.select';

export interface UpsertOAuthUserInput {
  email: string;
  name?: string;
  avatar?: string;
  provider: OAuthProvider;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}

export type MembershipWithConfig = EventStaff & {
  event: { config: EventConfig | null; status: EventStatus };
};

export type UserWithMemberships = SafeUser & {
  memberships: MembershipWithConfig[];
};

export interface CreateLocalUserInput {
  email: string;
  username: string;
  name: string;
  passwordHash: string;
}
