import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useUpdateEventConfig } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import type { AttendeeAccess, Event, MediaAccess, UpdateEventConfigDto } from '~/api/events/events.types';

const TOGGLE_FIELDS: { field: keyof UpdateEventConfigDto; labelKey: string; descriptionKey: string }[] = [
  {
    field: 'registrationsEnabled',
    labelKey: 'manage.settings.config.registrations',
    descriptionKey: 'manage.settings.registrationsDescription',
  },
  {
    field: 'prizesEnabled',
    labelKey: 'manage.settings.config.prizes',
    descriptionKey: 'manage.settings.prizesDescription',
  },
];

const ACCESS_VALUES: AttendeeAccess[] = ['ANYONE', 'ATTENDEES_ONLY', 'ORGANIZERS_ONLY', 'DISABLED'];
const MEDIA_VALUES: MediaAccess[] = ['ANYONE', 'ATTENDEES_ONLY', 'ORGANIZERS_ONLY', 'DISABLED'];
const TOGGLE_DEFAULTS: Record<Extract<keyof UpdateEventConfigDto, 'registrationsEnabled' | 'prizesEnabled'>, boolean> = {
  registrationsEnabled: true,
  prizesEnabled: true,
};

interface EventSettingsCardProps {
  event: Event;
}

export function EventSettingsCard({ event }: EventSettingsCardProps) {
  const { t } = useTranslation('events');
  const apiError = useApiError();
  const { canManageConfig } = useEventAccess(event.id);
  const { mutate: updateConfig, isPending } = useUpdateEventConfig(event.id);
  const isPublicEvent = event.eventType === 'PUBLIC';

  const handleToggle = (field: keyof UpdateEventConfigDto, value: boolean) => {
    updateConfig(
      { [field]: value },
      {
        onSuccess: () => toast.success(t('manage.settings.success')),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const handleAttendeeAccess = (value: AttendeeAccess) => {
    updateConfig(
      { attendeeAccess: value },
      {
        onSuccess: () => toast.success(t('manage.settings.success')),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const handleMediaAccess = (value: MediaAccess) => {
    updateConfig(
      { mediaAccess: value },
      {
        onSuccess: () => toast.success(t('manage.settings.success')),
        onError: (err) => toast.error(apiError(err)),
      },
    );
  };

  const currentAttendeeAccess = event.config?.attendeeAccess ?? 'ATTENDEES_ONLY';
  const currentMediaAccess = event.config?.mediaAccess ?? 'ATTENDEES_ONLY';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('manage.settings.title')}</CardTitle>
        <CardDescription>
          {t('manage.settings.autoSave', { defaultValue: 'Changes are saved automatically' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {TOGGLE_FIELDS.map(({ field, labelKey, descriptionKey }) => (
          <div
            key={field}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div className="min-w-0">
              <Label className="font-medium">{t(labelKey)}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(descriptionKey, { defaultValue: '' })}
              </p>
            </div>

            <Switch
              checked={event.config?.[field] as boolean ?? TOGGLE_DEFAULTS[field as keyof typeof TOGGLE_DEFAULTS]}
              onCheckedChange={(v) => handleToggle(field, v)}
              disabled={isPending || !canManageConfig}
            />
          </div>
        ))}

        {/* Guest list access select */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <Label className="font-medium">{t('manage.settings.config.publicGuestList')}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(`accessLevels.attendeeAccess.${currentAttendeeAccess}.description`)}
            </p>
          </div>

          <Select
            value={currentAttendeeAccess}
            onValueChange={(v) => handleAttendeeAccess(v as AttendeeAccess)}
            disabled={isPending || !canManageConfig}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCESS_VALUES.filter(
                (v) => v !== 'ANYONE' || isPublicEvent,
              ).map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`accessLevels.attendeeAccess.${v}.label`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Media access select */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <Label className="font-medium">{t('manage.settings.config.mediaUploads')}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(`accessLevels.mediaAccess.${currentMediaAccess}.description`)}
            </p>
          </div>

          <Select
            value={currentMediaAccess}
            onValueChange={(v) => handleMediaAccess(v as MediaAccess)}
            disabled={isPending || !canManageConfig}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_VALUES.filter(
                (v) => v !== 'ANYONE' || isPublicEvent,
              ).map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`accessLevels.mediaAccess.${v}.label`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
