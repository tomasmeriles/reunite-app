export interface MediaItem {
  id: string;
  eventId: string;
  uploadedByUserId: string | null;
  uploaderName: string | null;
  isOwn: boolean;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string;
}

export interface UploadMediaResponse {
  item: MediaItem;
}
