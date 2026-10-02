'use client';

import { OwnerPhotos } from '@/components/media/OwnerPhotos';

/** The proof-of-delivery photos of one order (media owner type "delivery", owner id = the order id). */
export function DeliveryPhotos({ orderId }: { orderId: string }) {
  return <OwnerPhotos ownerType="delivery" ownerId={orderId} ns="fulfil.photos" camera />;
}
