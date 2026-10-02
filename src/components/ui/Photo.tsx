'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PhotoProps {
  picture: { cardUrl: string; thumbUrl: string } | null;
  alt: string;
  /** card (800px) for grids, thumb (300px) for small rows. */
  variant?: 'card' | 'thumb';
  sizes: string;
  radius?: number;
  priority?: boolean;
}

/**
 * Product picture, or the striped .fc-photo placeholder when a product has none
 * (or its picture can no longer be loaded — an old order may point at a deleted file).
 * Fills its positioned parent, so the parent owns the size / aspect ratio.
 */
export function Photo({ picture, alt, variant = 'card', sizes, radius = 14, priority }: PhotoProps) {
  const url = picture ? (variant === 'card' ? picture.cardUrl : picture.thumbUrl) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) {
    return <div className="fc-photo" style={{ position: 'absolute', inset: 0, borderRadius: radius }} role="img" aria-label={alt} />;
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedUrl(url)}
      style={{ objectFit: 'cover', borderRadius: radius }}
    />
  );
}
