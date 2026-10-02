'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Plus, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FreeShipProgress, Totals } from '@/components/cart/CartSummary';
import { useCartActions } from '@/components/cart/useCartActions';
import { PageHead } from '@/components/layout/PageHead';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Photo } from '@/components/ui/Photo';
import { Stepper } from '@/components/ui/Stepper';
import { deliveryFee } from '@/lib/delivery';
import { useDeliveryTerms } from '@/lib/useDeliveryTerms';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { useGetMeQuery } from '@/store/api/identityApi';
import type { CartItem } from '@/store/api/cartApi';

const ISSUE_KEY = {
  UNAVAILABLE: 'unavailable',
  OUT_OF_STOCK: 'outOfStock',
  EXCEEDS_MAX_PER_ORDER: 'exceedsMax',
} as const;

/** The buyer's combo before checkout (design: CartPage). The server cart is the source of truth. */
export function CartScreen() {
  const t = useTranslations('cart');
  const ts = useTranslations('shop');
  const locale = useLocale();
  const { cart, setQuantity, busy } = useCartActions();
  const { zones, zoneFeeCents: zoneFee, freeOverCents } = useDeliveryTerms();
  const { data: me } = useGetMeQuery();
  const [removing, setRemoving] = useState<CartItem | null>(null);

  const items = cart?.items ?? [];
  const subtotalCents = cart?.subtotalCents ?? 0;
  const places = [...new Set(zones.map((z) => localized(locale, z.municipality.nameEs, z.municipality.nameEn)))];
  const count = cart?.itemCount ?? 0;
  // Checkout needs a signed-in buyer; guests log in first and come straight back.
  const checkoutHref = me?.role === 'buyer' ? '/checkout' : { pathname: '/account/sign-in', query: { next: '/checkout' } };

  const nameOf = (item: CartItem) => (item.product ? localized(locale, item.product.nameEs, item.product.nameEn) : t('unavailable'));

  return (
    <div className="fc-page">
      <PageHead
        title={ts('panel.title')}
        sub={places.length ? t('sub', { count, place: places.join(', ') }) : t('subNoPlace', { count })}
        back={{ href: '/shop', label: t('keepShopping') }}
      />

      {items.length === 0 ? (
        <Card className="fc-emptycard">
          <ShoppingBag size={32} aria-hidden />
          <div className="fc-emptycard__title">{t('emptyTitle')}</div>
          <div className="fc-emptycard__text">{t('emptyText')}</div>
          <Link href="/shop" className="fc-btn fc-btn--primary" style={{ marginTop: 8 }}>
            <Store size={18} aria-hidden />
            {t('goShop')}
          </Link>
        </Card>
      ) : (
        <div className="fc-cart">
          <div className="fc-cart__lines">
            <Card padding={0}>
              {items.map((item) => {
                const href = item.product ? `/products/${item.product.slug}` : '/';
                const max = Math.min(99, item.product?.maxPerOrder ?? 99);
                return (
                  <div key={item.productId} className="fc-cartline">
                    <Link href={href} className="fc-cartline__photo" tabIndex={-1} aria-hidden>
                      <Photo picture={item.product?.picture ?? null} alt={nameOf(item)} variant="thumb" sizes="64px" radius={12} />
                    </Link>
                    <div className="fc-cartline__body">
                      <Link href={href} className="fc-cartline__name">
                        {nameOf(item)}
                      </Link>
                      {item.product && (
                        <div className="fc-cartline__meta">
                          {item.product.unitLabel} · {formatUsd(item.product.unitPriceCents)}
                        </div>
                      )}
                      {item.issue && <div className="fc-cartline__issue">{t(ISSUE_KEY[item.issue])}</div>}
                      <div className="fc-cartline__total fc-cartline__total--inline">{formatUsd(item.lineTotalCents)}</div>
                    </div>
                    <Stepper
                      min={0}
                      max={max}
                      value={item.quantity}
                      disabled={busy}
                      labels={{ less: ts('less'), more: ts('more') }}
                      // Going to 0 asks first, exactly like the trash button.
                      onChange={(next) => (next === 0 ? setRemoving(item) : setQuantity(item.productId, next))}
                    />
                    <div className="fc-cartline__total fc-cartline__total--col">{formatUsd(item.lineTotalCents)}</div>
                    <IconButton icon={Trash2} variant="plain" size={36} label={t('remove')} className="fc-cartline__trash" onClick={() => setRemoving(item)} />
                  </div>
                );
              })}
            </Card>
            <Link href="/shop" className="fc-btn fc-btn--plain" style={{ justifySelf: 'start' }}>
              <Plus size={18} aria-hidden />
              {t('addMore')}
            </Link>
          </div>

          <Card padding={20} className="fc-cart__summary">
            <div className="fc-cart__summary-title">{t('summary')}</div>
            <FreeShipProgress subtotalCents={subtotalCents} freeOverCents={freeOverCents} />
            <Totals subtotalCents={subtotalCents} feeCents={deliveryFee(subtotalCents, zoneFee, freeOverCents)} />
            {cart?.checkoutReady ? (
              <Link href={checkoutHref} className="fc-btn fc-btn--primary fc-btn--lg fc-btn--block">
                {t('continue')}
                <ArrowRight size={20} aria-hidden />
              </Link>
            ) : (
              <>
                <Button block size="lg" iconRight={ArrowRight} disabled>
                  {t('continue')}
                </Button>
                <div className="fc-cartline__issue" role="alert">
                  {t('notReady')}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <Alert
        open={removing !== null}
        title={t('removeTitle')}
        message={t('removeText')}
        cancelLabel={t('cancel')}
        confirmLabel={t('removeConfirm')}
        destructive
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && setQuantity(removing.productId, 0)}
      />
    </div>
  );
}
