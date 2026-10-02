'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Photo } from '@/components/ui/Photo';
import { formatDate } from '@/lib/format';
import { useGetDeliveryProofQuery } from '@/store/api/fulfilmentApi';

/**
 * The proof of delivery (photo + who received it). For a buyer in Miami who cannot verify anything
 * themselves this is the most reassuring thing on the page (CLAUDE.md section 12). Renders nothing
 * when no proof was recorded.
 */
export function DeliveryProofCard({ orderId, bare = false }: { orderId: string; bare?: boolean }) {
  const t = useTranslations('fulfil.proof');
  const locale = useLocale();
  const { data: proof } = useGetDeliveryProofQuery(orderId);
  if (!proof) return null;

  const body = (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="fc-settings__cardtitle">{t('title')}</div>
      {proof.photos.length > 0 && (
        <div className="fc-photos__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {proof.photos.map((p) => (
            <a key={p.id} href={p.fullUrl ?? p.cardUrl ?? undefined} target="_blank" rel="noreferrer" className="fc-photo-item__img" aria-label={t('openPhoto')}>
              <Photo picture={p.cardUrl ? { thumbUrl: p.thumbUrl ?? p.cardUrl, cardUrl: p.cardUrl } : null} alt={t('photoAlt')} variant="card" sizes="200px" radius={12} />
            </a>
          ))}
        </div>
      )}
      <div className="fc-note">
        {proof.recipientName ? t('receivedBy', { name: proof.recipientName }) : t('delivered')} · {formatDate(proof.deliveredAt, locale)}
      </div>
      {proof.notes && <div className="fc-note">{proof.notes}</div>}
    </div>
  );
  return bare ? body : <Card padding={20}>{body}</Card>;
}
