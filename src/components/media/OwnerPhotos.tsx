'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, ImagePlus, RotateCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Photo } from '@/components/ui/Photo';
import { compressImage } from '@/lib/compressImage';
import { uploadFileToPresignedUrl } from '@/lib/upload';
import type { MediaOwnerType } from '@/types/media';
import {
  useConfirmUploadMutation,
  useDeleteMediaMutation,
  useGetManagedMediaQuery,
  useRequestUploadMutation,
} from '@/store/api/mediaApi';

interface Upload {
  key: string;
  file: File;
  progress: number;
  state: 'uploading' | 'failed';
}

/**
 * The pictures of one owner that a person takes or picks themselves (a delivery photo, a screenshot of
 * a transfer): compressed in the browser first (a phone photo over Cuban mobile data is a failed
 * upload), with progress and a retry button per file. `ns` is the message namespace holding the
 * labels (title, add, processing, failed, remove, retry, uploadFailed).
 */
export function OwnerPhotos({
  ownerType,
  ownerId,
  ns,
  camera = false,
}: {
  ownerType: MediaOwnerType;
  ownerId: string;
  ns: string;
  /** Ask a phone for its camera instead of the gallery. */
  camera?: boolean;
}) {
  const t = useTranslations(ns);
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const { data: media = [], refetch } = useGetManagedMediaQuery({ ownerType, ownerId });
  const [requestUpload] = useRequestUploadMutation();
  const [confirmUpload] = useConfirmUploadMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  // A confirmed upload becomes thumbnails in a background worker; look again until nothing is pending.
  const pending = media.some((m) => m.status === 'pending');
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => void refetch(), 2000);
    return () => clearInterval(timer);
  }, [pending, refetch]);

  function patch(key: string, change: Partial<Upload>) {
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...change } : u)));
  }

  async function send(upload: Upload) {
    patch(upload.key, { state: 'uploading', progress: 0 });
    try {
      const { file, contentType } = await compressImage(upload.file);
      const permission = await requestUpload({ ownerType, ownerId, contentType }).unwrap();
      await uploadFileToPresignedUrl(permission, file, (progress) => patch(upload.key, { progress }));
      await confirmUpload(permission.mediaId).unwrap();
      setUploads((list) => list.filter((u) => u.key !== upload.key));
      void refetch();
    } catch {
      patch(upload.key, { state: 'failed' });
    }
  }

  function add(files: FileList | null) {
    if (!files) return;
    const fresh: Upload[] = [...files].map((file) => ({ key: crypto.randomUUID(), file, progress: 0, state: 'uploading' }));
    setUploads((list) => [...list, ...fresh]);
    fresh.forEach((u) => void send(u));
    if (input.current) input.current.value = '';
  }

  return (
    <div className="fc-photos">
      <div className="fc-photos__head">
        <span className="fc-field__label">{t('title')}</span>
        <Button size="sm" variant="secondary" icon={camera ? Camera : ImagePlus} onClick={() => input.current?.click()}>
          {t('add')}
        </Button>
        {/* capture asks a phone for its camera; a desktop just opens the file picker */}
        <input ref={input} type="file" accept="image/*" capture={camera ? 'environment' : undefined} multiple hidden onChange={(e) => add(e.target.files)} />
      </div>
      <div className="fc-photos__grid">
        {media.map((m) => (
          <div key={m.id} className="fc-photo-item">
            <div className="fc-photo-item__img">
              <Photo picture={m.thumbUrl ? { thumbUrl: m.thumbUrl, cardUrl: m.cardUrl ?? m.thumbUrl } : null} alt="" variant="thumb" sizes="120px" radius={12} />
            </div>
            <div className="fc-photo-item__bar">
              {m.status === 'pending' && <Badge tone="warning" size="sm">{t('processing')}</Badge>}
              {m.status === 'failed' && <Badge tone="danger" size="sm">{t('failed')}</Badge>}
              <span style={{ flex: 1 }} />
              <IconButton icon={Trash2} variant="plain" size={28} label={t('remove')} onClick={() => deleteMedia(m.id)} />
            </div>
          </div>
        ))}
        {uploads.map((u) => (
          <div key={u.key} className="fc-photo-item">
            <div className="fc-photo-item__img fc-photo-item__img--upload">
              {u.state === 'uploading' ? (
                <>
                  <div className="fc-ship__bar" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} style={{ width: '70%' }}>
                    <div className="fc-ship__fill" style={{ width: `${u.progress}%` }} />
                  </div>
                  <span className="fc-note">{u.progress}%</span>
                </>
              ) : (
                <span className="fc-photo-item__error">{t('uploadFailed')}</span>
              )}
            </div>
            <div className="fc-photo-item__bar">
              <span style={{ flex: 1 }} />
              {u.state === 'failed' && (
                <>
                  <IconButton icon={RotateCw} variant="plain" size={28} label={t('retry')} onClick={() => void send(u)} />
                  <IconButton icon={Trash2} variant="plain" size={28} label={t('remove')} onClick={() => setUploads((list) => list.filter((x) => x.key !== u.key))} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
