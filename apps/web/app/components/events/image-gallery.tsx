import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import {
  useMedia,
  useUploadMedia,
  useDeleteMedia,
} from '~/hooks/api/use-media';
import { useAuth } from '~/contexts/auth';
import { useApiError } from '~/hooks/use-api-error';

interface ImageGalleryProps {
  eventId: string;
  canUpload: boolean;
  guestToken: string | null;
}

export function ImageGallery({
  eventId,
  canUpload,
  guestToken,
}: ImageGalleryProps) {
  const apiError = useApiError();
  const { user } = useAuth();
  const { data: items, isLoading } = useMedia(eventId);
  const { mutate: upload, isPending: uploading } = useUploadMedia(
    eventId,
    guestToken,
  );
  const { mutate: remove } = useDeleteMedia(eventId, guestToken);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload(file, {
      onSuccess: () => toast.success('Photo uploaded!'),
      onError: (err) => toast.error(apiError(err)),
    });
    e.target.value = '';
  };

  const handleDelete = (mediaId: string) => {
    if (!confirm('Remove this photo?')) return;
    remove(mediaId, {
      onSuccess: () => toast.success('Photo removed'),
      onError: (err) => toast.error(apiError(err)),
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '+ Add Photo'}
          </Button>
        </div>
      )}

      {!items?.length && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No photos yet. Be the first to share a moment! 📸
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items?.map((item) => {
          const canDelete =
            user?.id === item.uploadedById || guestToken !== null;
          return (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={item.thumbnailUrl}
                alt="Event photo"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <a
                href={item.fullUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"
              />
              {canDelete && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-1 top-1 hidden rounded-full bg-destructive p-1 text-white group-hover:flex"
                  aria-label="Remove photo"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
