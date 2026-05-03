import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, ShieldCheck, Users, X } from 'lucide-react';
import { DebouncedSearchInput } from '~/components/ui/debounced-search-input';
import { toast } from 'sonner';
import { DateTime } from 'luxon';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {
  useAllAttendeesInfinite,
  useRemoveAttendee,
} from '~/hooks/api/use-attendance';
import type { EventAttendee } from '~/api/attendance/attendance.types';

type StatusFilter = 'all' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  WAITLISTED: 'secondary',
  CANCELLED: 'destructive',
};

interface ManageAttendeesCardProps {
  eventId: string;
  staffRoles?: Record<string, 'OWNER' | 'ORGANIZER'>;
  currentUserRole?: 'OWNER' | 'ORGANIZER';
}

export function ManageAttendeesCard({ eventId, staffRoles = {}, currentUserRole }: ManageAttendeesCardProps) {
  const { t } = useTranslation(['events', 'attendance', 'common']);
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useAllAttendeesInfinite(eventId, search || undefined);
  const { mutate: removeAttendee, isPending: removing } = useRemoveAttendee(eventId);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [pendingRemove, setPendingRemove] = useState<EventAttendee | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAttendees = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  const counts = {
    CONFIRMED: allAttendees.filter((a) => a.status === 'CONFIRMED').length,
    WAITLISTED: allAttendees.filter((a) => a.status === 'WAITLISTED').length,
    CANCELLED: allAttendees.filter((a) => a.status === 'CANCELLED').length,
  };

  const visible =
    filter === 'all' ? allAttendees : allAttendees.filter((a) => a.status === filter);

  const handleConfirmRemove = () => {
    if (!pendingRemove) return;
    const targetId = pendingRemove.id;
    const targetName =
      pendingRemove.guestName ??
      pendingRemove.user?.name ??
      pendingRemove.user?.username ??
      'Guest';
    setRemovingId(targetId);
    setPendingRemove(null);
    removeAttendee(targetId, {
      onSuccess: () => {
        setRemovingId(null);
        toast.success(t('events:manage.attendees.removeSuccess', { name: targetName }));
      },
      onError: () => {
        setRemovingId(null);
        toast.error(t('events:manage.attendees.removeError'));
      },
    });
  };

  const filters: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: t('events:manage.attendees.filters.all'), count: total },
    { value: 'CONFIRMED', label: t('events:manage.attendees.filters.confirmed'), count: counts.CONFIRMED },
    { value: 'WAITLISTED', label: t('events:manage.attendees.filters.waitlisted'), count: counts.WAITLISTED },
    { value: 'CANCELLED', label: t('events:manage.attendees.filters.cancelled'), count: counts.CANCELLED },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <CardTitle>{t('events:manage.attendees.title')}</CardTitle>
            <CardDescription>{t('events:manage.attendees.description')}</CardDescription>
          </div>
          {!isLoading && (
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              <Users className="mr-1 h-3 w-3" />
              {counts.CONFIRMED} {t('events:manage.attendees.confirmed')}
            </Badge>
          )}
        </CardHeader>

        {/* Search */}
        <div className="px-6 pb-3">
          <DebouncedSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('events:manage.attendees.searchPlaceholder')}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 overflow-x-auto px-6 pb-4">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
              {count != null && (
                <span
                  className={`tabular-nums ${filter === value ? 'opacity-80' : 'opacity-60'}`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="divide-y divide-border">
              {visible.map((attendee) => {
                const isRemoving = removingId === attendee.id;
                const staffRole = attendee.userId ? staffRoles[attendee.userId] : undefined;
                const name =
                  attendee.guestName ??
                  attendee.user?.name ??
                  attendee.user?.username ??
                  'Guest';
                const username = attendee.user?.username;
                const avatar = attendee.user?.avatar ?? undefined;
                const initials = name.charAt(0).toUpperCase();
                const statusVariant = STATUS_BADGE_VARIANT[attendee.status];
                const isGuest = !attendee.userId;
                const targetIsStaff = !!staffRole;
                const canRemoveThis =
                  (attendee.status === 'CONFIRMED' || attendee.status === 'WAITLISTED') &&
                  (!targetIsStaff || currentUserRole === 'OWNER');

                return (
                  <div
                    key={attendee.id}
                    className={`flex items-start gap-3 px-6 py-3 transition-opacity ${isRemoving ? 'opacity-40' : ''}`}
                  >
                    <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{name}</span>
                        {staffRole === 'OWNER' && (
                          <Crown className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        {staffRole === 'ORGANIZER' && (
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                        )}
                        {isGuest && (
                          <span className="text-xs text-muted-foreground">
                            {t('events:manage.attendees.guest')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {username ? `@${username} · ` : ''}
                        {DateTime.fromISO(attendee.registeredAt).toRelative()}
                      </p>
                      {attendee.status === 'CANCELLED' && attendee.cancellationReason && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          &ldquo;{attendee.cancellationReason}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {statusVariant && (
                        <Badge variant={statusVariant} className="text-xs">
                          {t(`attendance:status.${attendee.status}`)}
                        </Badge>
                      )}
                      {canRemoveThis && !isRemoving && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingRemove(attendee)}
                          disabled={removing}
                          aria-label={`Remove ${name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('events:manage.attendees.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove &&
                t('events:manage.attendees.removeDesc', {
                  name:
                    pendingRemove.guestName ??
                    pendingRemove.user?.name ??
                    pendingRemove.user?.username ??
                    'Guest',
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:actions.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({ filter }: { filter: StatusFilter }) {
  const { t } = useTranslation('events');
  const messages: Record<StatusFilter, string> = {
    all: t('manage.attendees.emptyAll'),
    CONFIRMED: t('manage.attendees.emptyConfirmed'),
    WAITLISTED: t('manage.attendees.emptyWaitlisted'),
    CANCELLED: t('manage.attendees.emptyCancelled'),
  };
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Users className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{messages[filter]}</p>
    </div>
  );
}
