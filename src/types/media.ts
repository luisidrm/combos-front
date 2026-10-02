export interface PublicPicture {
  id: string;
  thumbUrl: string;
  cardUrl: string;
  fullUrl: string;
  width: number | null;
  height: number | null;
  altTextEs: string | null;
  altTextEn: string | null;
  isCover: boolean;
}

export type MediaOwnerType = 'product' | 'user' | 'delivery' | 'tenant' | 'payment_proof';
export type MediaStatus = 'pending' | 'ready' | 'failed';

export interface MediaView {
  id: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  status: MediaStatus;
  isCover: boolean;
  sortOrder: number;
  altTextEs: string | null;
  altTextEn: string | null;
  width: number | null;
  height: number | null;
  thumbUrl: string | null;
  cardUrl: string | null;
  fullUrl: string | null;
  createdAt: string;
}
