import { useCallback, useRef, useState } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { DateTime } from 'luxon';
import {
  DownloadIcon,
  Trash2Icon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { DialogOverlay, DialogPortal } from '~/components/ui/dialog';
import type { MediaItem } from '~/api/media/media.types';

interface ImageLightboxProps {
  items: MediaItem[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (id: string) => void;
  onDownload: (item: MediaItem) => void;
  isStaff?: boolean;
}

export function ImageLightbox({
  items,
  selectedIndex,
  onClose,
  onNavigate,
  onDelete,
  onDownload,
  isStaff = false,
}: ImageLightboxProps) {
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const touchStartX = useRef<number | null>(null);

  const total = items.length;
  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  const goNext = useCallback(() => {
    if (selectedIndex === null || total === 0) return;
    setDirection('next');
    onNavigate((selectedIndex + 1) % total);
  }, [selectedIndex, total, onNavigate]);

  const goPrev = useCallback(() => {
    if (selectedIndex === null || total === 0) return;
    setDirection('prev');
    onNavigate((selectedIndex - 1 + total) % total);
  }, [selectedIndex, total, onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  const formattedDate = selected?.createdAt
    ? DateTime.fromISO(selected.createdAt).toLocaleString(DateTime.DATE_MED)
    : null;

  return (
    <RadixDialog.Root open={selectedIndex !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <RadixDialog.Content
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center outline-none"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
        >
          {selected && (
            <>
              {/* Top bar */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm font-medium text-white/70">
                  {(selectedIndex ?? 0) + 1} / {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => onDownload(selected)}
                    title="Download"
                  >
                    <DownloadIcon />
                  </Button>
                  {(isStaff || selected.isOwn) && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-white hover:bg-destructive/80 hover:text-white"
                      onClick={() => onDelete(selected.id)}
                      title="Delete"
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                  <RadixDialog.Close asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      <XIcon />
                    </Button>
                  </RadixDialog.Close>
                </div>
              </div>

              {/* Prev / Next */}
              {total > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all duration-150 hover:scale-110 hover:bg-black/70"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="size-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all duration-150 hover:scale-110 hover:bg-black/70"
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="size-5" />
                  </button>
                </>
              )}

              {/* Image */}
              <img
                key={selected.id}
                src={selected.url}
                alt="Event photo"
                className={`max-h-[80vh] max-w-[calc(100vw-5rem)] cursor-default rounded-sm object-contain ${
                  direction === 'next'
                    ? 'animate-(--animate-slide-from-right)'
                    : 'animate-(--animate-slide-from-left)'
                }`}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Bottom info bar */}
              <div
                className="absolute bottom-0 left-0 right-0 flex flex-col gap-1.5 bg-linear-to-t from-black/80 to-transparent px-5 pb-4 pt-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {selected.uploaderName && (
                    <span className="flex items-center gap-1.5 text-xs text-white/80">
                      <UserIcon className="size-3 shrink-0" />
                      {selected.isOwn ? 'You' : selected.uploaderName}
                    </span>
                  )}
                  {formattedDate && (
                    <span className="flex items-center gap-1.5 text-xs text-white/60">
                      <CalendarIcon className="size-3 shrink-0" />
                      {formattedDate}
                    </span>
                  )}
                </div>
                {selected.caption && (
                  <p className="text-sm text-white/90">{selected.caption}</p>
                )}
              </div>
            </>
          )}
        </RadixDialog.Content>
      </DialogPortal>
    </RadixDialog.Root>
  );
}
