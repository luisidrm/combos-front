'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Photo } from '@/components/ui/Photo';
import { formatDate, formatUsd } from '@/lib/format';
import { useGetManagedMediaQuery } from '@/store/api/mediaApi';
import type { TransferReport } from '@/store/api/ordersApi';

const LABEL: Record<TransferReport['method'], string> = { zelle: 'Zelle', cashapp: 'Cash App', paypal: 'PayPal' };

/**
 * What an admin needs to confirm a manual transfer: the amount to look for, the app, the confirmation
 * number, the buyer's note and their screenshot. The check itself happens in the store's own
 * Zelle / Cash App / PayPal account; "mark as paid" (below, admins only) is what moves the order on.
 */
export function PaymentReview({
  orderId,
  orderNumber,
  totalCents,
  report,
  pending,
}: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  report: TransferReport | null;
  /** Still waiting for payment: the only state where the check matters. */
  pending: boolean;
}) {
  const t = useTranslations('adm.orders.review');
  const locale = useLocale();
  const { data: shots = [] } = useGetManagedMediaQuery({ ownerType: 'payment_proof', ownerId: orderId });
  const ready = shots.filter((s) => s.status === 'ready');

  return (
    <div className="fc-reviewbox">
      <div className="fc-field__label">{t('title')}</div>
      <div className="fc-reviewbox__row">
        <span>{t('lookFor')}</span>
        <strong>
          {formatUsd(totalCents)} · #{orderNumber}
        </strong>
      </div>
      {report ? (
        <>
          <div className="fc-reviewbox__row">
            <span>{t('app')}</span>
            <strong>{LABEL[report.method]}</strong>
          </div>
          <div className="fc-reviewbox__row">
            <span>{t('number')}</span>
            <strong className="fc-mono">{report.transferReference}</strong>
          </div>
          <div className="fc-reviewbox__row">
            <span>{t('reported')}</span>
            <span>{formatDate(report.reportedAt, locale)}</span>
          </div>
          {report.notes && (
            <div className="fc-reviewbox__row">
              <span>{t('note')}</span>
              <span style={{ textAlign: 'right' }}>{report.notes}</span>
            </div>
          )}
        </>
      ) : (
        <div className="fc-note">{pending ? t('notReported') : t('noReport')}</div>
      )}
      {ready.length > 0 && (
        <div className="fc-photos__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
          {ready.map((s) => (
            <a key={s.id} href={s.fullUrl ?? s.cardUrl ?? undefined} target="_blank" rel="noreferrer" className="fc-photo-item__img" aria-label={t('openShot')}>
              <Photo picture={s.thumbUrl ? { thumbUrl: s.thumbUrl, cardUrl: s.cardUrl ?? s.thumbUrl } : null} alt={t('shotAlt')} variant="thumb" sizes="120px" radius={12} />
            </a>
          ))}
        </div>
      )}
      {report && pending && <div className="fc-note">{t('hint')}</div>}
    </div>
  );
}
