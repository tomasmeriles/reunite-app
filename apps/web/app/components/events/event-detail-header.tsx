import { Link, useNavigate } from '@tanstack/react-router';
import {
  Check,
  LogOut,
  Settings,
  UserCheck,
  UserPlus,
  Zap,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  SplitButton,
  type SplitButtonOption,
} from '~/components/buttons/split-button';
import { useBreakpoint } from '~/hooks/use-breakpoint';
import { STATUS_META } from '~/lib/event-state-machine';
import type { Event } from '~/api/events/events.types';

interface EventDetailHeaderProps {
  event: Event;
  isAttending: boolean;
  canJoin: boolean;
  canAddGuest: boolean;
  canAddSelf: boolean;
  inviteLinkRemaining: number | null;
  registering: boolean;
  addingGuest: boolean;
  showManage: boolean;
  canUnregisterSelf: boolean;
  onJoin: () => void;
  onAddGuest: () => void;
  onAddSelf: () => void;
  onLeave: () => void;
}

export function EventDetailHeader({
  event,
  isAttending,
  canJoin,
  canAddGuest,
  canAddSelf,
  inviteLinkRemaining,
  registering,
  addingGuest,
  showManage,
  canUnregisterSelf,
  onJoin,
  onAddGuest,
  onAddSelf,
  onLeave,
}: EventDetailHeaderProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'xs';
  const navigate = useNavigate();

  const statusMeta = STATUS_META[event.status];
  const startDate = new Date(event.startAt);

  const ManageIcon = () => <Settings className="h-3.5 w-3.5" />;

  const leaveOption: SplitButtonOption = {
    value: 'leave',
    label: 'Leave event',
    icon: <LogOut className="h-3.5 w-3.5" />,
    variant: 'destructive',
    separator: true,
  };

  function renderActions() {
    if (isAttending) {
      if (canAddGuest && showManage) {
        return (
          <SplitButton
            primary={{
              value: 'bring-friend',
              label:
                inviteLinkRemaining !== null
                  ? `Bring a friend · ${inviteLinkRemaining} left`
                  : 'Bring a friend',
              icon: <UserPlus className="h-3.5 w-3.5" />,
              variant: 'outline',
            }}
            options={[
              { value: 'manage', label: 'Manage', icon: <ManageIcon /> },
              ...(canUnregisterSelf ? [leaveOption] : []),
            ]}
            onSelect={(v) => {
              if (v === 'bring-friend') onAddGuest();
              if (v === 'manage')
                navigate({
                  to: '/events/$id/manage',
                  params: { id: event.id },
                });
              if (v === 'leave') onLeave();
            }}
            isLoading={addingGuest}
            size="sm"
          />
        );
      }

      if (canAddGuest) {
        if (canUnregisterSelf) {
          return (
            <SplitButton
              primary={{
                value: 'bring-friend',
                label:
                  inviteLinkRemaining !== null
                    ? `Bring a friend · ${inviteLinkRemaining} left`
                    : 'Bring a friend',
                icon: <UserPlus className="h-3.5 w-3.5" />,
                variant: 'outline',
              }}
              options={[leaveOption]}
              onSelect={(v) => {
                if (v === 'bring-friend') onAddGuest();
                if (v === 'leave') onLeave();
              }}
              isLoading={addingGuest}
              size="sm"
            />
          );
        }
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddGuest}
            disabled={addingGuest}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Bring a friend
            {inviteLinkRemaining !== null && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {inviteLinkRemaining} left
              </Badge>
            )}
          </Button>
        );
      }

      if (showManage) {
        if (canUnregisterSelf) {
          return (
            <SplitButton
              primary={{
                value: 'manage',
                label: 'Manage',
                icon: <ManageIcon />,
                variant: 'outline',
              }}
              options={[leaveOption]}
              onSelect={(v) => {
                if (v === 'manage')
                  navigate({
                    to: '/events/$id/manage',
                    params: { id: event.id },
                  });
                if (v === 'leave') onLeave();
              }}
              size="sm"
            />
          );
        }
        return (
          <Button variant="outline" size="sm" asChild>
            <Link to="/events/$id/manage" params={{ id: event.id }}>
              <ManageIcon />
              Manage
            </Link>
          </Button>
        );
      }

      if (canUnregisterSelf) {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeave}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Leave event
          </Button>
        );
      }

      return null;
    }

    // Not attending
    if (canAddSelf) {
      return (
        <SplitButton
          primary={{
            value: 'manage',
            label: 'Manage',
            icon: <ManageIcon />,
            variant: 'outline',
          }}
          options={[
            {
              value: 'add-self',
              label: 'Add me',
              icon: <UserCheck className="h-3.5 w-3.5" />,
            },
          ]}
          onSelect={(v) => {
            if (v === 'manage')
              navigate({ to: '/events/$id/manage', params: { id: event.id } });
            if (v === 'add-self') onAddSelf();
          }}
          disabled={registering}
          size="sm"
        />
      );
    }

    if (canJoin) {
      return (
        <>
          <Button onClick={onJoin} disabled={registering}>
            <Zap className="mr-1.5 h-4 w-4" />
            Jump in
          </Button>
          {showManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/$id/manage" params={{ id: event.id }}>
                {<ManageIcon />}
                <span className="ml-1.5">Manage</span>
              </Link>
            </Button>
          )}
        </>
      );
    }

    if (showManage) {
      return (
        <Button variant="outline" size="sm" asChild>
          <Link to="/events/$id/manage" params={{ id: event.id }}>
            {<ManageIcon />}
            <span className="ml-1.5">Manage</span>
          </Link>
        </Button>
      );
    }

    return null;
  }

  return (
    <div
      className={`flex gap-4 ${isMobile ? 'flex-col' : 'items-center justify-between'}`}
    >
      {/* Left: title, status, date, location */}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold leading-tight">{event.title}</h1>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>
        <p className="text-muted-foreground">
          {startDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {event.location && (
          <p className="text-sm text-muted-foreground">📍 {event.location}</p>
        )}
      </div>

      {/* Right: CTA buttons */}
      <div
        className={`flex shrink-0 gap-2 ${
          isMobile ? 'flex-row flex-wrap' : 'flex-col items-end'
        }`}
      >
        {isAttending && (
          <Badge className="bg-success text-success-foreground">
            <Check className="mr-1.5 h-3.5 w-3.5" />
            You&apos;re attending
          </Badge>
        )}
        {renderActions()}
      </div>
    </div>
  );
}
