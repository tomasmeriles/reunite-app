import { CameraIcon, ImageIcon, Loader2Icon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface UploadPhotoButtonProps {
  onGallery: () => void;
  onCamera: () => void;
  uploading?: boolean;
}

// TODO: Standarize this button and move to ui library
export function UploadPhotoButton({
  onGallery,
  onCamera,
  uploading,
}: UploadPhotoButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={uploading}>
        <button
          disabled={uploading}
          className="group relative flex cursor-pointer items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:shadow-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CameraIcon className="size-4 transition-transform duration-300 group-hover:rotate-12" />
          )}
          {uploading ? 'Uploading…' : 'Add Photo'}
          {!uploading && (
            <span className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-200 group-hover:bg-white/10" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 cursor-pointer">
        <DropdownMenuItem onClick={onGallery}>
          <ImageIcon className="size-4" />
          Choose from gallery
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCamera}>
          <CameraIcon className="size-4" />
          Take a photo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
