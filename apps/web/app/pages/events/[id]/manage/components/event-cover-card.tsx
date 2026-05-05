import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { ImageWithFallback } from '~/components/ui/image-with-fallback';
import { EventCoverPlaceholder } from '~/components/events/event-cover-placeholder';
import { useUploadEventCover } from '~/hooks/api/use-events';
import { useEventAccess } from '~/hooks/use-permission';
import { useApiError } from '~/hooks/use-api-error';
import type { Event } from '~/api/events/events.types';

interface EventCoverCardProps {
  event: Event;
}

export function EventCoverCard({ event }: EventCoverCardProps) {
  const apiError = useApiError();
  const { canEdit } = useEventAccess(event.id);
  const { mutate: uploadCover, isPending } = useUploadEventCover(event.id);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadCover(file, {
      onSuccess: () => toast.success('Cover image updated'),
      onError: (err) => toast.error(apiError(err)),
    });
  };

  return (
    <Card className="overflow-hidden">
      <ImageWithFallback
        src={event.coverImage}
        alt={event.title}
        className="w-full h-auto block"
        fallback={
          <EventCoverPlaceholder
            title={event.title}
            className="aspect-3/1 w-full"
            size="xl"
          />
        }
      />
      <CardContent className="flex items-center justify-between py-3">
        <p className="text-sm text-muted-foreground">Cover image</p>
        {canEdit && (
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild disabled={isPending}>
              <span>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {isPending ? 'Uploading…' : 'Upload cover'}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleUpload}
              disabled={isPending}
            />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
