import { Injectable } from '@nestjs/common';
import { createMongoAbility, subject } from '@casl/ability';
import { EventRole, GlobalRole } from '@prisma/client';
import type {
  AppAbility,
  PackedAbility,
} from '../interfaces/ability.interface';
import type { UserWithMemberships } from '../../modules/users/interfaces/user.interface';

@Injectable()
export class CaslAbilityFactory {
  /**
   * Builds the full ability set for a user across ALL their event memberships.
   * Rules carry conditions (e.g. { id: eventId }) so CASL evaluates them when
   * the caller passes a tagged subject: ability.can('update', subject('Event', { id })).
   *
   * Config-gated rules (chat, media, prizes) are only added when the event
   * has the corresponding module enabled, so toggling EventConfig automatically
   * changes what organizers are allowed to do after the cache expires.
   */
  buildAbilities(user: UserWithMemberships): AppAbility {
    const rules: PackedAbility[] = [];

    // SUPER_ADMIN can do everything everywhere
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      rules.push({ action: 'manage', subject: 'all' });
      return createMongoAbility<AppAbility>(rules);
    }

    // MODERATOR can manage all events and their staff, nothing else
    if (user.globalRole === GlobalRole.MODERATOR) {
      rules.push({ action: 'manage', subject: 'Event' });
      rules.push({ action: 'manage', subject: 'EventStaff' });
      rules.push({
        action: 'read',
        subject: 'User',
        conditions: { id: user.id },
      });
      rules.push({
        action: 'update',
        subject: 'User',
        conditions: { id: user.id },
      });
      return createMongoAbility<AppAbility>(rules);
    }

    for (const membership of user.memberships) {
      const { eventId, role, event } = membership;
      const config = event.config;

      switch (role) {
        case EventRole.OWNER:
          // Full control regardless of config — owner can always re-enable modules
          rules.push({
            action: 'manage',
            subject: 'Event',
            conditions: { id: eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventStaff',
            conditions: { eventId },
          });
          rules.push({
            action: 'read',
            subject: 'User',
            conditions: { 'memberships.eventId': eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventConfig',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'InviteLink',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventWhitelistEntry',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventAttendee',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'ChatMessage',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'MediaItem',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'Prize',
            conditions: { eventId },
          });
          break;

        case EventRole.ORGANIZER:
          // Base rules — always available
          rules.push({
            action: 'read',
            subject: 'Event',
            conditions: { id: eventId },
          });
          rules.push({
            action: 'update',
            subject: 'Event',
            conditions: { id: eventId },
          });
          rules.push({
            action: 'create',
            subject: 'EventStaff',
            conditions: { eventId },
          });
          rules.push({
            action: 'read',
            subject: 'EventStaff',
            conditions: { eventId },
          });
          rules.push({
            action: 'read',
            subject: 'User',
            conditions: { 'memberships.eventId': eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'InviteLink',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventWhitelistEntry',
            conditions: { eventId },
          });
          rules.push({
            action: 'manage',
            subject: 'EventAttendee',
            conditions: { eventId },
          });
          // Config-gated module rules
          if (config?.chatEnabled) {
            rules.push({
              action: 'create',
              subject: 'ChatMessage',
              conditions: { eventId },
            });
            rules.push({
              action: 'read',
              subject: 'ChatMessage',
              conditions: { eventId },
            });
          }
          if (config?.mediaEnabled) {
            rules.push({
              action: 'manage',
              subject: 'MediaItem',
              conditions: { eventId },
            });
          }
          if (config?.prizesEnabled) {
            rules.push({
              action: 'manage',
              subject: 'Prize',
              conditions: { eventId },
            });
          }
          break;
      }
    }

    // Every authenticated user can read/update their own profile and create events
    rules.push({
      action: 'read',
      subject: 'User',
      conditions: { id: user.id },
    });
    rules.push({
      action: 'update',
      subject: 'User',
      conditions: { id: user.id },
    });
    rules.push({ action: 'create', subject: 'Event' });

    return createMongoAbility<AppAbility>(rules);
  }
}

// Re-export subject helper so consumers don't need to import from @casl/ability directly
export { subject };
