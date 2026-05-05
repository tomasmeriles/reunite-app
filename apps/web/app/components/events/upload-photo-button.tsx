import { CameraIcon, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MenuButton } from '~/components/buttons/menu-button';

interface UploadPhotoButtonProps {
  onGallery: () => void;
  onCamera: () => void;
  uploading?: boolean;
}

type UploadAction = 'gallery' | 'camera';

export function UploadPhotoButton({
  onGallery,
  onCamera,
  uploading,
}: UploadPhotoButtonProps) {
  const { t } = useTranslation(['events']);

  const OPTIONS = [
    {
      value: 'gallery' as UploadAction,
      label: t('events:detail.gallery.chooseFromGallery'),
      icon: <ImageIcon className="size-4" />,
    },
    {
      value: 'camera' as UploadAction,
      label: t('events:detail.gallery.takePhoto'),
      icon: <CameraIcon className="size-4" />,
    },
  ];

  const handlers: Record<UploadAction, () => void> = {
    gallery: onGallery,
    camera: onCamera,
  };

  return (
    <MenuButton<UploadAction>
      label={t('events:detail.gallery.addPhoto')}
      icon={<CameraIcon className="size-4" />}
      options={OPTIONS}
      onSelect={(value) => handlers[value]()}
      isLoading={uploading}
      loadingText={t('events:detail.gallery.uploading')}
      variant="default"
    />
  );
}
