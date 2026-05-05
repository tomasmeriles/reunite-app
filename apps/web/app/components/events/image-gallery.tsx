import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Trash2Icon } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import { EmptyState } from '~/components/ui/empty-state';
import { ConfirmModal } from '~/components/ui/modal';
import { ItemActionsMenu } from '~/components/ui/item-actions-menu';
import { UploadPhotoButton } from '~/components/events/upload-photo-button';
import { ImageLightbox } from '~/components/events/image-lightbox';
import {
  useMediaInfinite,
  useUploadMedia,
  useDeleteMedia,
} from '~/hooks/api/use-media';
import { useApiError } from '~/hooks/use-api-error';
import type { MediaItem } from '~/api/media/media.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ImageGalleryProps {
  eventId: string;
  canUpload: boolean;
  isStaff?: boolean;
  guestToken: string | null;
}

async function downloadBlob(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `photo-${Date.now()}.webp`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ImageGallery({
  eventId,
  canUpload,
  isStaff = false,
  guestToken,
}: ImageGalleryProps) {
  const { t } = useTranslation(['events', 'common']);
  const apiError = useApiError();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMediaInfinite(eventId, guestToken);
  const { mutate: upload, isPending: uploading } = useUploadMedia(eventId, guestToken);
  const { mutate: remove, isPending: deleting } = useDeleteMedia(eventId, guestToken);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('detail.gallery.fileTooLarge'));
      return;
    }
    upload(file, {
      onSuccess: () => toast.success(t('detail.gallery.uploadSuccess')),
      onError: (err) => toast.error(apiError(err)),
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    const isSelected = items[selectedIndex ?? -1]?.id === deleteTargetId;
    remove(deleteTargetId, {
      onSuccess: () => {
        toast.success(t('detail.gallery.removeSuccess'));
        if (isSelected) setSelectedIndex(null);
      },
      onError: (err) => toast.error(apiError(err)),
    });
    setDeleteTargetId(null);
  };

  if (isLoading) {
    return (
      <div className="columns-2 gap-3 sm:columns-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <Skeleton
              className="w-full rounded-lg"
              style={{ height: `${140 + (i % 3) * 60}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {canUpload && (
        <div className="mb-4">
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleUpload}
          />
          <UploadPhotoButton
            uploading={uploading}
            onGallery={() => galleryInputRef.current?.click()}
            onCamera={() => cameraInputRef.current?.click()}
          />
        </div>
      )}

      {!items.length ? (
        <EmptyState
          icon={ImageIcon}
          message={t('detail.gallery.empty')}
          description={
            canUpload
              ? t('detail.gallery.emptyUpload')
              : t('detail.gallery.emptyJoin')
          }
        />
      ) : (
        <div className="columns-2 gap-3 sm:columns-3">
          {items.map((item, index) => {
            const canDelete = isStaff || item.isOwn;
            return (
              <div
                key={item.id}
                className="group relative mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded-lg bg-muted"
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt="Event photo"
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                {canDelete && (
                  <div className="absolute right-2 top-2">
                    <ItemActionsMenu
                      actions={[
                        {
                          label: t('detail.gallery.deletePhoto'),
                          icon: Trash2Icon,
                          variant: 'destructive',
                          onClick: (e) => {
                            e.stopPropagation();
                            setDeleteTargetId(item.id);
                          },
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="columns-2 gap-3 sm:columns-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3 break-inside-avoid">
              <Skeleton
                className="w-full rounded-lg"
                style={{ height: `${140 + (i % 2) * 60}px` }}
              />
            </div>
          ))}
        </div>
      )}

      <ImageLightbox
        items={items}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
        onDownload={(item: MediaItem) => downloadBlob(item.url)}
        onDelete={(id) => setDeleteTargetId(id)}
        isStaff={isStaff}
      />

      <ConfirmModal
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={t('detail.gallery.removeTitle')}
        description={t('detail.gallery.removeDesc')}
        confirmLabel={t('common:actions.remove')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
    </>
  );
}
