'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, RotateCw, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Photo } from '@/components/ui/Photo';
import { compressImage } from '@/lib/compressImage';
import { uploadFileToPresignedUrl } from '@/lib/upload';
import { useAppDispatch } from '@/store';
import { catalogApi } from '@/store/api/catalogApi';
import {
  useConfirmUploadMutation,
  useDeleteMediaMutation,
  useGetManagedMediaQuery,
  useRequestUploadMutation,
  useSetCoverMediaMutation,
} from '@/store/api/mediaApi';

interface Upload {
  key: string;
  file: File;
  progress: number;
  state: 'uploading' | 'failed';
  error?: string;
}

/**
 * A product's pictures: add (compressed in the browser first), see processing state, pick the cover,
 * delete. Built for a bad connection: each file shows its own progress and a retry button.
 */
export function ProductPhotos({ productId }: { productId: string }) {
  const t = useTranslations('adm.products.photos');
  const dispatch = useAppDispatch();
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const { data: media = [], refetch } = useGetManagedMediaQuery({ ownerType: 'product', ownerId: productId });
  const [requestUpload] = useRequestUploadMutation();
  const [confirmUpload] = useConfirmUploadMutation();
  const [setCover] = useSetCoverMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  // A confirmed upload is turned into thumbnails by a background worker; look again until nothing is pending.
  const pending = media.some((m) => m.status === 'pending');
  useEffect(() => {
    if (!pending) {
      // Whatever just finished may have made the product publishable or changed its cover.
      dispatch(catalogApi.util.invalidateTags(['AdminProduct']));
      return;
    }
    const timer = setInterval(() => void refetch(), 2000);
    return () => clearInterval(timer);
  }, [pending, refetch, dispatch]);

  function patch(key: string, change: Partial<Upload>) {
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...change } : u)));
  }

  async function send(upload: Upload) {
    patch(upload.key, { state: 'uploading', progress: 0, error: undefined });
    try {
      const { file, contentType } = await compressImage(upload.file);
      const permission = await requestUpload({ ownerType: 'product', ownerId: productId, contentType }).unwrap();
      await uploadFileToPresignedUrl(permission, file, (progress) => patch(upload.key, { progress }));
      await confirmUpload(permission.mediaId).unwrap();
      setUploads((list) => list.filter((u) => u.key !== upload.key));
      void refetch();
    } catch (err) {
      patch(upload.key, { state: 'failed', error: err instanceof Error && /decode|image/i.test(err.message) ? 'format' : 'network' });
    }
  }

  function add(files: FileList | null) {
    if (!files) return;
    const fresh: Upload[] = [...files].map((file) => ({ key: crypto.randomUUID(), file, progress: 0, state: 'uploading' }));
    setUploads((list) => [...list, ...fresh]);
    fresh.forEach((u) => void send(u));
    if (input.current) input.current.value = '';
  }

  const hasReady = media.some((m) => m.status === 'ready');

  return (
    <div className="fc-photos">
      <div className="fc-photos__head">
        <span className="fc-field__label">{t('title')}</span>
        <Button size="sm" variant="secondary" icon={ImagePlus} onClick={() => input.current?.click()}>
          {t('add')}
        </Button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      </div>
      {!hasReady && uploads.length === 0 && <div className="fc-note">{t('needOne')}</div>}

      <div className="fc-photos__grid">
        {media.map((m) => (
          <div key={m.id} className="fc-photo-item">
            <div className="fc-photo-item__img">
              <Photo picture={m.thumbUrl ? { thumbUrl: m.thumbUrl, cardUrl: m.cardUrl ?? m.thumbUrl } : null} alt="" variant="thumb" sizes="120px" radius={12} />
            </div>
            <div className="fc-photo-item__bar">
              {m.status === 'pending' && <Badge tone="warning" size="sm">{t('processing')}</Badge>}
              {m.status === 'failed' && <Badge tone="danger" size="sm">{t('failed')}</Badge>}
              {m.status === 'ready' && m.isCover && <Badge tone="accent" size="sm">{t('cover')}</Badge>}
              <span style={{ flex: 1 }} />
              {m.status === 'ready' && !m.isCover && (
                <IconButton icon={Star} variant="plain" size={28} label={t('makeCover')} onClick={() => setCover({ id: m.id, ownerType: 'product', ownerId: productId })} />
              )}
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
                <span className="fc-photo-item__error">{u.error === 'format' ? t('badFormat') : t('uploadFailed')}</span>
              )}
            </div>
            <div className="fc-photo-item__bar">
              <span className="fc-note" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.file.name}</span>
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
