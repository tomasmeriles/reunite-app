import { useParams, Link } from '@tanstack/react-router';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Settings2, ExternalLink, Users } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useEvent } from '~/hooks/api/use-events';
import { useAuth } from '~/contexts/auth';
import { OverviewTab } from './components/overview-tab';
import { ConfigTab } from './components/config-tab';
import { ManageAttendeesCard } from './components/manage-attendees-card';

const TABS = ['overview', 'config', 'attendees'] as const;
type TabValue = (typeof TABS)[number];

export default function EventManagePage() {
  const { t } = useTranslation(['events', 'common']);
  const { id } = useParams({ from: '/app/events/$id/manage' });
  const [tab, setTab] = useQueryState<TabValue>(
    'tab',
    parseAsStringLiteral(TABS).withDefault('overview'),
  );

  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const staffRoles = Object.fromEntries(
    (event?.staff ?? []).map((s) => [s.userId, s.role]),
  ) as Record<string, 'OWNER' | 'ORGANIZER'>;
  const currentUserRole = user?.id ? staffRoles[user.id] : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">{t('events:detail.eventNotFound')}</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('events:manage.title')} · {event.title} — Reunite</title>
      </Helmet>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('events:manage.title')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="shrink-0 self-start"
          >
            <Link to="/events/$id" params={{ id }}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t('common:actions.view')}
            </Link>
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => void setTab(v as TabValue)}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1 gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t('events:manage.tabs.settings')}
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              {t('events:manage.tabs.guestList')}
            </TabsTrigger>
            <TabsTrigger value="attendees" className="flex-1 gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {t('events:manage.tabs.attendees')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab event={event} />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <ConfigTab event={event} />
          </TabsContent>

          <TabsContent value="attendees" className="mt-4">
            <ManageAttendeesCard
              eventId={id}
              staffRoles={staffRoles}
              currentUserRole={currentUserRole}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
