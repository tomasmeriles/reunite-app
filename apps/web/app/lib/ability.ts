import {
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
  type ForcedSubject,
} from '@casl/ability';
import type { Action, PackedAbility, Subject } from '~/lib/types';

type SubjectStr = Exclude<Subject, 'all'>;

// ForcedSubject<SubjectStr> is what subject() returns — must be in the union
// so ability.can(action, subject('Event', { id })) compiles.
export type AppAbility = MongoAbility<
  [Action, SubjectStr | ForcedSubject<SubjectStr> | 'all']
>;

export function buildAbility(rules: PackedAbility[]): AppAbility {
  return createMongoAbility<AppAbility>(rules as RawRuleOf<AppAbility>[]);
}

export const emptyAbility = buildAbility([]);
