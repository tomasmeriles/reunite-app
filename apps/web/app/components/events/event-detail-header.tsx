import { Link, useNavigate } from '@tanstack/react-router';
import {
  Check,
  LogOut,
  MapPin,
  Settings,
  UserCheck,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  registrationsClosed: boolean;
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
  registrationsClosed,
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
  const { t } = useTranslation(['events', 'common']);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'xs';
  const navigate = useNavigate();

  const statusMeta = STATUS_META[event.status];
  const startDate = new Date(event.startAt);

  const ManageIcon = () => <Settings className="h-3.5 w-3.5" />;

  const leaveOption: SplitButtonOption = {
    value: 'leave',
    label: t('events:detail.leaveEvent'),
    icon: <LogOut className="h-3.5 w-3.5" />,
    variant: 'destructive',
    separator: true,
  };

  const bringFriendLabel =
    inviteLinkRemaining !== null
      ? `${t('events:detail.bringAFriend')} · ${inviteLinkRemaining} ${t('events:detail.inviteLinkLeft')}`
      : t('events:detail.bringAFriend');

  function renderActions() {
    if (isAttending) {
      if (registrationsClosed && event.eventType !== 'INVITE_ACCOUNT') {
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled
              title={t('events:detail.registrationsClosedDesc')}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              {t('events:detail.bringAFriend')}
            </Button>
            {showManage && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/events/$id/manage" params={{ id: event.id }}>
                  <ManageIcon />
                  <span className="ml-1.5">{t('events:detail.manage')}</span>
                </Link>
              </Button>
            )}
            {canUnregisterSelf && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                {t('events:detail.leaveEvent')}
              </Button>
            )}
          </>
        );
      }

      if (canAddGuest && showManage) {
        return (
          <SplitButton
            primary={{
              value: 'bring-friend',
              label: bringFriendLabel,
              icon: <UserPlus className="h-3.5 w-3.5" />,
              variant: 'outline',
            }}
            options={[
              {
                value: 'manage',
                label: t('events:detail.manage'),
                icon: <ManageIcon />,
              },
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
                label: bringFriendLabel,
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
            {t('events:detail.bringAFriend')}
            {inviteLinkRemaining !== null && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {inviteLinkRemaining} {t('events:detail.inviteLinkLeft')}
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
                label: t('events:detail.manage'),
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
              {t('events:detail.manage')}
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
            {t('events:detail.leaveEvent')}
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
            label: t('events:detail.manage'),
            icon: <ManageIcon />,
            variant: 'outline',
          }}
          options={[
            {
              value: 'add-self',
              label: t('events:detail.addMe'),
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
            {t('events:detail.jumpIn')}
          </Button>
          {showManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/$id/manage" params={{ id: event.id }}>
                {<ManageIcon />}
                <span className="ml-1.5">{t('events:detail.manage')}</span>
              </Link>
            </Button>
          )}
        </>
      );
    }

    if (registrationsClosed) {
      return (
        <>
          <Button disabled title={t('events:detail.registrationsClosedDesc')}>
            <Zap className="mr-1.5 h-4 w-4" />
            {t('events:detail.jumpIn')}
          </Button>
          {showManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/$id/manage" params={{ id: event.id }}>
                {<ManageIcon />}
                <span className="ml-1.5">{t('events:detail.manage')}</span>
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
            <span className="ml-1.5">{t('events:detail.manage')}</span>
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
          <Badge variant={statusMeta.variant}>
            {t(`common:status.${event.status}`)}
          </Badge>
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
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {event.latitude && event.longitude ? (
                <a
                  href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-medium underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground transition-colors"
                >
                  {event.location}
                </a>
              ) : (
                event.location
              )}
              {(event.city || event.country) && (
                <span className="ml-1 text-xs opacity-75">
                  · {[event.city, event.country].filter(Boolean).join(', ')}
                </span>
              )}
            </span>
          </div>
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
            {t('events:detail.attending')}
          </Badge>
        )}
        {renderActions()}
      </div>
    </div>
  );
}
