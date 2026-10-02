// Phone photos are 3-5 MB; over Cuban mobile data that is a failed upload (CLAUDE.md section 9).
// Shrink to at most 1280px on the long edge and re-encode as WebP (JPEG where WebP encoding is
// unavailable) before anything is sent. The server still makes its own derivatives.
export interface CompressedImage {
  file: File;
  contentType: 'image/webp' | 'image/jpeg';
}

const MAX_EDGE = 1280;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<CompressedImage> {
  // Throws for formats the browser cannot decode (e.g. HEIC outside Safari): the caller shows it.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp', 0.82);
  if (webp && webp.type === 'image/webp') {
    return { file: new File([webp], 'photo.webp', { type: 'image/webp' }), contentType: 'image/webp' };
  }
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!jpeg) throw new Error('Could not encode the image');
  return { file: new File([jpeg], 'photo.jpg', { type: 'image/jpeg' }), contentType: 'image/jpeg' };
}
