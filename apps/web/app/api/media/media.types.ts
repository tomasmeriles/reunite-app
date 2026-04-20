export interface MediaItem {
  id: string;
  eventId: string;
  uploadedById: string;
  fullUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  uploadedAt: string;
}

export interface UploadMediaResponse {
  item: MediaItem;
}
