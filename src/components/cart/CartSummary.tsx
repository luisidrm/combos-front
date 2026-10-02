'use client';

import { useTranslations } from 'next-intl';
import { CircleCheck, Truck } from 'lucide-react';
import { formatUsd } from '@/lib/format';

// Shared by the Shop's combo panel and the Cart page, so both show the same
// "free delivery" progress and the same totals.

/** Renders nothing when the store has no free-delivery offer. */
export function FreeShipProgress({ subtotalCents, freeOverCents }: { subtotalCents: number; freeOverCents: number | null }) {
  const t = useTranslations('shop.panel');
  if (freeOverCents === null || freeOverCents === 0) return null;
  const left = Math.max(0, freeOverCents - subtotalCents);
  const pct = Math.min(100, (subtotalCents / freeOverCents) * 100);
  const Icon = left ? Truck : CircleCheck;
  return (
    <div className={`fc-ship${left ? '' : ' fc-ship--done'}`}>
      <div className="fc-ship__text">
        <Icon size={16} aria-hidden />
        {left ? t('freeLeft', { amount: formatUsd(left) }) : t('freeReached')}
      </div>
      <div className="fc-ship__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="fc-ship__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** `feeCents` null = no delivery zone known yet: the delivery row is left out. */
export function Totals({ subtotalCents, feeCents }: { subtotalCents: number; feeCents: number | null }) {
  const t = useTranslations('shop.panel');
  const free = feeCents === 0 && subtotalCents > 0;
  return (
    <div className="fc-totals">
      <div className="fc-totals__row">
        <span>{t('subtotal')}</span>
        <span>{formatUsd(subtotalCents)}</span>
      </div>
      {feeCents != null && (
        <div className={`fc-totals__row${free ? ' fc-totals__row--free' : ''}`}>
          <span>{t('delivery')}</span>
          <span>{feeCents ? formatUsd(feeCents) : t('free')}</span>
        </div>
      )}
      <div className="fc-totals__rule" />
      <div className="fc-totals__row fc-totals__row--total">
        <span>{t('total')}</span>
        <span>{formatUsd(subtotalCents + (feeCents ?? 0))}</span>
      </div>
    </div>
  );
}
