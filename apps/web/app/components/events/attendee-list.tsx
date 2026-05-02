import { useEffect, useRef, useState } from 'react';
import { Crown, SearchX, ShieldCheck, Users } from 'lucide-react';
import { DebouncedSearchInput } from '~/components/ui/debounced-search-input';
import { EmptyState } from '~/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Skeleton } from '~/components/ui/skeleton';
import { useAttendeesInfinite } from '~/hooks/api/use-attendance';
import { useBreakpoint } from '~/hooks/use-breakpoint';

interface AttendeeListProps {
  eventId: string;
  currentAttendeeId?: string;
  staffRoles?: Record<string, 'OWNER' | 'ORGANIZER'>;
}

const STATUS_DOT: Record<string, string> = {
  CONFIRMED: 'bg-green-500',
  WAITLISTED: 'bg-yellow-400',
  CANCELLED: 'bg-red-400',
};

export function AttendeeList({ eventId, currentAttendeeId, staffRoles }: AttendeeListProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useAttendeesInfinite(eventId, search || undefined);
  const breakpoint = useBreakpoint();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isMobile = breakpoint === 'xs';
  const avatarPreviewCount = isMobile ? 3 : 5;
  const gridCols = isMobile
    ? 'grid-cols-3'
    : breakpoint === 'sm'
      ? 'grid-cols-4'
      : 'grid-cols-5';

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
  const preview = allAttendees.slice(0, avatarPreviewCount);
  const overflow = total - avatarPreviewCount;

  return (
    <div className="space-y-4">
      <DebouncedSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search guests…"
      />

      {isLoading && (
        <div className={`grid ${gridCols} gap-3`}>
          {Array.from({ length: isMobile ? 6 : 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {!allAttendees.length && !isLoading && (
        search
          ? <EmptyState icon={SearchX} message="No guests match your search." />
          : <EmptyState icon={Users} message="No guests yet." description="Share the event link to get people in!" />
      )}

      {/* Header: stacked avatars + total count */}
      {!!allAttendees.length && (
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {preview.map((a) => {
              const name = a.guestName ?? a.user?.name ?? a.user?.username ?? 'G';
              return (
                <Avatar key={a.id} className="h-7 w-7 ring-2 ring-background">
                  <AvatarImage src={a.user?.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {overflow > 0 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{overflow}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{total} attending</span>
        </div>
      )}

      {/* Card grid */}
      <div className={`grid ${gridCols} gap-3`}>
        {allAttendees.map((attendee) => {
          const isMe = attendee.id === currentAttendeeId;
          const staffRole = attendee.userId ? staffRoles?.[attendee.userId] : undefined;
          const name =
            attendee.guestName ??
            attendee.user?.name ??
            attendee.user?.username ??
            'Guest';
          const username = attendee.user?.username;
          const avatar = attendee.user?.avatar ?? undefined;
          const initials = name.charAt(0).toUpperCase();
          const sponsorName = attendee.sponsoredBy
            ? (attendee.sponsoredBy.guestName ??
              attendee.sponsoredBy.user?.name ??
              attendee.sponsoredBy.user?.username)
            : null;
          const dotColor = STATUS_DOT[attendee.status] ?? 'bg-muted-foreground';

          return (
            <div
              key={attendee.id}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-transform hover:-translate-y-0.5 ${
                isMe
                  ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/30'
                  : 'bg-card'
              }`}
            >
              <div className="relative">
                <Avatar
                  className={`h-14 w-14 ${isMe ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                >
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-lg font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-background ${dotColor}`}
                />
                {staffRole === 'OWNER' && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm">
                    <Crown className="h-3 w-3 text-yellow-500" />
                  </span>
                )}
                {staffRole === 'ORGANIZER' && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm">
                    <ShieldCheck className="h-3 w-3 text-blue-400" />
                  </span>
                )}
              </div>

              <div className="w-full space-y-0.5 text-center">
                <p className="truncate text-sm font-medium leading-tight">
                  {name}
                  {isMe && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
                {username && (
                  <p className="truncate text-xs text-muted-foreground">
                    @{username}
                  </p>
                )}
                {sponsorName && (
                  <p className="truncate text-xs text-muted-foreground">
                    guest of {sponsorName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className={`grid ${gridCols} gap-3`}>
          {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}
