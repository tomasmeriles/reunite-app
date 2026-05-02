import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { useUpdateEventConfig } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import type { Event, UpdateEventConfigDto } from '~/api/events/events.types';

const TOGGLES: {
  field: keyof UpdateEventConfigDto;
  label: string;
  description: string;
}[] = [
  {
    field: 'attendeesPublic',
    label: 'Public guest list',
    description: 'Anyone can see who is attending',
  },
  {
    field: 'chatEnabled',
    label: 'Chat',
    description: 'Allow attendees to message each other',
  },
  {
    field: 'mediaEnabled',
    label: 'Media uploads',
    description: 'Attendees can share photos and videos',
  },
  {
    field: 'prizesEnabled',
    label: 'Prizes',
    description: 'Enable the prizes feature for this event',
  },
];

interface EventSettingsCardProps {
  event: Event;
}

export function EventSettingsCard({ event }: EventSettingsCardProps) {
  const apiError = useApiError();
  const { canManageConfig } = useEventAccess(event.id);
  const { mutate: updateConfig, isPending } = useUpdateEventConfig(event.id);

  const handleToggle = (field: keyof UpdateEventConfigDto, value: boolean) => {
    updateConfig(
      { [field]: value },
      {
        onSuccess: () => toast.success('Settings updated'),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event settings</CardTitle>
        <CardDescription>Changes are saved automatically</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {TOGGLES.map(({ field, label, description }) => (
          <div
            key={field}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div className="min-w-0">
              <Label className="font-medium">{label}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>

            <Switch
              checked={event.config?.[field] ?? false}
              onCheckedChange={(v) => handleToggle(field, v)}
              disabled={isPending || !canManageConfig}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
