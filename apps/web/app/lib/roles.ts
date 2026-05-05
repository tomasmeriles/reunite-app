import { Crown, ShieldCheck, UserCheck } from 'lucide-react';

export const ROLE_META = {
  OWNER: { icon: Crown, className: 'text-yellow-600 dark:text-yellow-400' },
  ORGANIZER: { icon: ShieldCheck, className: 'text-blue-600 dark:text-blue-400' },
  ATTENDEE: { icon: UserCheck, className: 'text-muted-foreground' },
} as const;

export type RoleType = keyof typeof ROLE_META;

export function getRoleMeta(role: string | null | undefined) {
  return role ? ROLE_META[role as RoleType] ?? null : null;
}
