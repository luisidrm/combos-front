'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCartActions } from '@/components/cart/useCartActions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Photo } from '@/components/ui/Photo';
import { Stepper } from '@/components/ui/Stepper';
import { FreeShipProgress, Totals } from '@/components/cart/CartSummary';
import { deliveryFee } from '@/lib/delivery';
import { useDeliveryTerms } from '@/lib/useDeliveryTerms';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';

/**
 * The buyer's combo (= server cart) beside the catalog on wide screens. Prices and
 * availability come straight from GET /cart — nothing here is computed from the
 * catalog list — so what is shown is what the server will charge.
 */
export function ComboPanel() {
  const locale = useLocale();
  const t = useTranslations('shop');
  const { cart, setQuantity, busy } = useCartActions();
  const { zoneFeeCents, freeOverCents } = useDeliveryTerms();
  const items = cart?.items ?? [];
  const subtotalCents = cart?.subtotalCents ?? 0;

  return (
    <Card variant="glass" padding={18} className="fc-panel" aria-label={t('panel.title')}>
      <div className="fc-panel__head">
        <div className="fc-panel__title">{t('panel.title')}</div>
        <div className="fc-panel__count">{t('panel.items', { count: cart?.itemCount ?? 0 })}</div>
      </div>

      {items.length === 0 ? (
        <div className="fc-panel__empty">
          <ShoppingBag size={28} aria-hidden />
          {t('panel.empty')}
        </div>
      ) : (
        <div className="fc-panel__lines">
          {items.map((item) => {
            const name = item.product ? localized(locale, item.product.nameEs, item.product.nameEn) : t('panel.unavailable');
            const max = Math.min(99, item.product?.maxPerOrder ?? 99);
            return (
              <div key={item.productId} className="fc-line">
                <div className="fc-line__photo">
                  <Photo picture={item.product?.picture ?? null} alt={name} variant="thumb" sizes="40px" radius={10} />
                </div>
                <div className="fc-line__body">
                  <div className="fc-line__name">{name}</div>
                  <div className={`fc-line__price${item.issue ? ' fc-line__price--issue' : ''}`}>
                    {item.issue === 'OUT_OF_STOCK' || item.issue === 'UNAVAILABLE'
                      ? t(item.issue === 'OUT_OF_STOCK' ? 'out' : 'panel.unavailable')
                      : item.issue === 'EXCEEDS_MAX_PER_ORDER'
                        ? t('maxReached', { max })
                        : formatUsd(item.lineTotalCents)}
                  </div>
                </div>
                <Stepper
                  size="sm"
                  min={0}
                  max={max}
                  value={item.quantity}
                  disabled={busy}
                  labels={{ less: t('less'), more: t('more') }}
                  onChange={(next) => setQuantity(item.productId, next)}
                />
              </div>
            );
          })}
        </div>
      )}

      <FreeShipProgress subtotalCents={subtotalCents} freeOverCents={freeOverCents} />
      <Totals subtotalCents={subtotalCents} feeCents={deliveryFee(subtotalCents, zoneFeeCents, freeOverCents)} />

      {items.length ? (
        <Link href="/cart" className="fc-btn fc-btn--primary fc-btn--lg fc-btn--block">
          {t('panel.review')}
          <ArrowRight size={20} aria-hidden />
        </Link>
      ) : (
        <Button block size="lg" iconRight={ArrowRight} disabled>
          {t('panel.review')}
        </Button>
      )}
    </Card>
  );
}

/** Phone / tablet: floating "Ver combo · 3 · $12.50" button (the side panel is hidden below 1080px). */
export function ComboBar() {
  const t = useTranslations('shop.panel');
  const { cart } = useCartActions();
  if (!cart || cart.itemCount === 0) return null;
  return (
    <div className="fc-combobar">
      <Link href="/cart" className="fc-btn fc-btn--primary fc-btn--lg fc-btn--block">
        {t('view')} · {cart.itemCount} · {formatUsd(cart.subtotalCents)}
        <ArrowRight size={20} aria-hidden />
      </Link>
    </div>
  );
}
