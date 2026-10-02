'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, CircleCheck, CreditCard, House, LoaderCircle, MapPin, Package, Receipt, RotateCcw, Truck, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Totals } from '@/components/cart/CartSummary';
import { PageHead } from '@/components/layout/PageHead';
import { DeliveryProofCard } from '@/components/fulfilment/DeliveryProofCard';
import { ManualPaymentCard } from '@/components/orders/ManualPaymentCard';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useAddressText } from '@/components/orders/useAddressText';
import { Photo } from '@/components/ui/Photo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { formatDate, formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { useRequireRole } from '@/lib/useRequireRole';
import { useMergeCartMutation } from '@/store/api/cartApi';
import { useCancelOrderMutation, useGetOrderByIdQuery, useGetPaymentInstructionsQuery, useRetryPaymentMutation } from '@/store/api/ordersApi';
import type { OrderStatus } from '@/store/api/ordersApi';

// The four stages a buyer sees. Backend states map onto them: paid, preparing,
// out_for_delivery, delivered. pending_payment is before the first stage, and
// cancelled / refunded are outside the path altogether.
const STEPS: Array<{ key: 'paid' | 'preparing' | 'onTheWay' | 'delivered'; icon: LucideIcon }> = [
  { key: 'paid', icon: Receipt },
  { key: 'preparing', icon: Package },
  { key: 'onTheWay', icon: Truck },
  { key: 'delivered', icon: House },
];
const STEP_OF: Partial<Record<OrderStatus, number>> = { paid: 0, preparing: 1, out_for_delivery: 2, delivered: 3 };

/** One order: tracking, or the confirmation moment right after paying (?payment=success). */
export function OrderScreen({ id }: { id: string }) {
  const t = useTranslations('orders');
  const locale = useLocale();
  const router = useRouter();
  const paymentParam = useSearchParams().get('payment');
  const { isReady } = useRequireRole('buyer', '/account/sign-in');

  const { data: order, isError, refetch } = useGetOrderByIdQuery(id, { skip: !isReady });
  // Coming back from the payment page, the provider's webhook may land a few seconds after
  // the buyer does: keep re-reading the order until it leaves pending_payment.
  const waiting = paymentParam === 'success' && order?.status === 'pending_payment';
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => void refetch(), 4000);
    return () => clearInterval(timer);
  }, [waiting, refetch]);

  // A manual-transfer order (Zelle / Cash App / PayPal) pays outside the site: it carries instructions
  // instead of a payment page. null for a card order.
  const { data: instructions } = useGetPaymentInstructionsQuery(id, { skip: !isReady });
  // Once the buyer has reported the transfer, an admin confirms it whenever they see the money: keep
  // looking so the page flips to "paid" without a reload.
  const awaitingCheck = order?.status === 'pending_payment' && Boolean(instructions?.report);
  useEffect(() => {
    if (!awaitingCheck) return;
    const timer = setInterval(() => void refetch(), 20000);
    return () => clearInterval(timer);
  }, [awaitingCheck, refetch]);

  const [retryPayment, { isLoading: retrying }] = useRetryPaymentMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [mergeCart, { isLoading: reordering }] = useMergeCartMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [payError, setPayError] = useState(false);
  const { line, area, reference } = useAddressText(order?.addressSnapshot ?? null);

  if (isError) {
    return (
      <div className="fc-page">
        <PageHead title={t('notFound')} back={{ href: '/account', label: t('back') }} />
      </div>
    );
  }
  if (!isReady || !order) {
    return (
      <div className="fc-page">
        <PageHead title={t('order')} back={{ href: '/account', label: t('back') }} />
      </div>
    );
  }

  const status = order.status;
  const pending = status === 'pending_payment';
  const manual = pending && instructions ? instructions : null;
  const step = STEP_OF[status];
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const justPaid = paymentParam === 'success';
  const name = order.recipientNameSnapshot;

  async function pay() {
    setPayError(false);
    try {
      const result = await retryPayment(order!.id).unwrap();
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else setPayError(true);
    } catch {
      setPayError(true);
    }
  }

  async function reorder() {
    const lines = order!.items.flatMap((i) => (i.productId ? [{ productId: i.productId, quantity: i.quantity }] : []));
    try {
      await mergeCart({ items: lines }).unwrap();
    } catch {
      // Some product may no longer be sold; the cart page shows what made it in.
    }
    router.push('/cart');
  }

  // The moment right after paying gets its own card; everything else is the regular tracking header.
  const hero =
    justPaid && pending ? (
      <Card className="fc-hero">
        <LoaderCircle size={44} className="fc-hero__spin" aria-hidden />
        <h1 className="fc-hero__title">{t('confirming')}</h1>
        <p className="fc-hero__text">{t('confirmingText')}</p>
      </Card>
    ) : justPaid ? (
      <Card className="fc-hero">
        <span className="fc-hero__badge">
          <CircleCheck size={34} aria-hidden />
        </span>
        <h1 className="fc-hero__title">{t('confirmed')}</h1>
        <div className="fc-hero__mono">#{order.orderNumber}</div>
        <p className="fc-hero__text">{t('confirmedText', { name })}</p>
      </Card>
    ) : null;

  return (
    <div className="fc-page">
      {hero ? (
        <div className="fc-hero__wrap">{hero}</div>
      ) : (
        <PageHead
          title={`${t('order')} #${order.orderNumber}`}
          sub={order.placedAt ? t('placed', { date: formatDate(order.placedAt, locale) }) : undefined}
          back={{ href: '/account', label: t('back') }}
        />
      )}

      <div className="fc-cart">
        <div className="fc-cart__lines">
          {!hero && (
            <Card className="fc-track">
              <div className="fc-track__top">
                <div className="fc-track__head">{t(`head.${status}`, { name })}</div>
                <StatusBadge status={status} />
              </div>
              {step !== undefined && (
                <ol className="fc-steps">
                  {STEPS.map((s, i) => {
                    const done = i <= step;
                    return (
                      <li key={s.key} className="fc-step" data-done={done} data-current={i === step}>
                        {i > 0 && <span className="fc-step__bar" />}
                        <span className="fc-step__dot">{i < step ? <Check size={18} aria-hidden /> : <s.icon size={18} aria-hidden />}</span>
                        <span className="fc-step__label">{t(`steps.${s.key}`)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {pending && !manual && <p className="fc-hero__text">{paymentParam === 'cancelled' ? t('paymentCancelled') : t('paymentPending')}</p>}
            </Card>
          )}

          {manual && <ManualPaymentCard info={manual} />}

          <List header={t('recipient')}>
            <ListRow icon={User} title={name} subtitle={<span className="fc-mono">{order.recipientPhonesSnapshot}</span>} />
            <ListRow icon={MapPin} iconBg="var(--red-500)" title={line} subtitle={[area, reference].filter(Boolean).join(' · ') || undefined} />
            {order.giftMessage && <ListRow icon={Package} iconBg="var(--gray-700)" title={order.giftMessage} subtitle={t('gift')} />}
            {!pending && status !== 'cancelled' && (
              <ListRow icon={CreditCard} iconBg="var(--gray-700)" title={instructions ? t('paidByTransfer') : t('paidByCard')} subtitle={t('items', { count: itemCount })} value={formatUsd(order.totalCents)} />
            )}
          </List>

          {hero && (
            <div className="fc-hero__actions">
              <Link href={`/account/orders/${order.id}`} className="fc-btn fc-btn--primary fc-btn--lg" style={{ flex: '1 1 200px' }}>
                <Package size={20} aria-hidden />
                {t('track')}
              </Link>
              <Link href="/shop" className="fc-btn fc-btn--secondary fc-btn--lg" style={{ flex: '1 1 200px' }}>
                {t('another')}
              </Link>
            </div>
          )}
        </div>

        <Card padding={20} className="fc-cart__summary">
          <div className="fc-cart__summary-title">{t('items', { count: itemCount })}</div>
          <div className="fc-sumlines">
            {order.items.map((item, i) => (
              <div key={i} className="fc-sumline">
                <span className="fc-sumline__photo">
                  <Photo
                    picture={item.productThumbUrl ? { thumbUrl: item.productThumbUrl, cardUrl: item.productThumbUrl } : null}
                    alt=""
                    variant="thumb"
                    sizes="36px"
                    radius={8}
                  />
                </span>
                <span className="fc-sumline__name">
                  {localized(locale, item.productNameEs, item.productNameEn)} <span className="fc-sumline__qty">× {item.quantity}</span>
                </span>
                <span className="fc-sumline__price">{formatUsd(item.lineTotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="fc-totals__rule" />
          <Totals subtotalCents={order.subtotalCents} feeCents={order.deliveryFeeCents} />

          {pending && (
            <>
              {!manual && (
                <Button size="lg" block icon={CreditCard} loading={retrying} onClick={pay}>
                  {t('payNow')} · {formatUsd(order.totalCents)}
                </Button>
              )}
              {payError && (
                <div className="fc-auth__error" role="alert">
                  {t('payFailed')}
                </div>
              )}
              <Button variant="tinted" block onClick={() => setConfirmCancel(true)}>
                {t('cancelOrder')}
              </Button>
            </>
          )}
          {status === 'delivered' && (
            <Button variant="secondary" block icon={RotateCcw} loading={reordering} onClick={reorder}>
              {t('reorder')}
            </Button>
          )}
        </Card>
      </div>

      {status === 'delivered' && <DeliveryProofCard orderId={order.id} />}

      <Alert
        open={confirmCancel}
        title={t('cancelTitle')}
        message={t('cancelText')}
        cancelLabel={t('keep')}
        confirmLabel={t('cancelOrder')}
        destructive
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelOrder({ id: order.id })}
      />
    </div>
  );
}
