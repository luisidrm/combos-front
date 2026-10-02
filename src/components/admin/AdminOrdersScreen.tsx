'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Printer, Search, User, X } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminFrame';
import { Totals } from '@/components/cart/CartSummary';
import { DeliverModal } from '@/components/fulfilment/DeliverModal';
import { PaymentReview } from '@/components/admin/PaymentReview';
import { DeliveryProofCard } from '@/components/fulfilment/DeliveryProofCard';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useAddressText } from '@/components/orders/useAddressText';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { Photo } from '@/components/ui/Photo';
import { TextField } from '@/components/ui/TextField';
import { formatDate, formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { useGetMeQuery } from '@/store/api/identityApi';
import {
  useAdminCancelOrderMutation,
  useAdminMarkOutForDeliveryMutation,
  useAdminMarkPaidMutation,
  useAdminMarkPreparingMutation,
  useAdminRefundOrderMutation,
  useGetAdminOrderByIdQuery,
  useGetAdminOrdersQuery,
} from '@/store/api/ordersApi';
import type { AdminOrderListItem, OrderStatus } from '@/store/api/ordersApi';

// 'transfer' = unpaid orders whose buyer says they sent a Zelle / Cash App / PayPal transfer: the ones to check.
type Filter = 'all' | 'transfer' | OrderStatus;
const FILTERS: Filter[] = ['all', 'transfer', 'paid', 'preparing', 'out_for_delivery', 'pending_payment', 'delivered', 'cancelled', 'refunded'];
const REFUNDABLE: OrderStatus[] = ['paid', 'preparing', 'out_for_delivery', 'delivered'];

type Confirm = 'markPaid' | 'cancel' | 'refund' | null;

function reasonOf(err: unknown): string | null {
  return (err as { data?: { error?: { details?: { reason?: string } } } } | null)?.data?.error?.details?.reason ?? null;
}

function OrderPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('adm.orders');
  const locale = useLocale();
  const { data: me } = useGetMeQuery();
  const isAdmin = me?.role === 'admin';
  const { data: order } = useGetAdminOrderByIdQuery(id);
  const { line, area, reference } = useAddressText(order?.addressSnapshot ?? null);

  const [markPreparing, a1] = useAdminMarkPreparingMutation();
  const [markOnTheWay, a2] = useAdminMarkOutForDeliveryMutation();
  const [markPaid, a4] = useAdminMarkPaidMutation();
  const [cancel, a5] = useAdminCancelOrderMutation();
  const [refund, a6] = useAdminRefundOrderMutation();
  const busy = [a1, a2, a4, a5, a6].some((m) => m.isLoading);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      const reason = reasonOf(err);
      setError(reason === 'ILLEGAL_TRANSITION' ? t('stale') : t('failed'));
    }
  }

  // The packer's one-tap "next step"; the money actions below it are for admins.
  const next: { label: string; run: () => Promise<unknown> } | null =
    order.status === 'paid'
      ? { label: t('startPreparing'), run: () => markPreparing({ id }).unwrap() }
      : order.status === 'preparing'
        ? { label: t('markOnTheWay'), run: () => markOnTheWay({ id }).unwrap() }
        : order.status === 'out_for_delivery'
          ? { label: t('markDelivered'), run: async () => setDelivering(true) }
          : null;

  const buyerName = order.buyer?.fullName ?? order.buyer?.email ?? '—';
  const confirmCopy = {
    markPaid: { title: t('markPaidTitle'), text: t('markPaidText'), label: t('markPaid'), go: () => markPaid({ id }).unwrap() },
    cancel: { title: t('cancelTitle'), text: t('cancelText'), label: t('cancel'), go: () => cancel({ id }).unwrap() },
    refund: { title: t('refundTitle'), text: t('refundText', { amount: formatUsd(order.totalCents) }), label: t('refund'), go: () => refund({ id }).unwrap() },
  } as const;

  return (
    <Card variant="glass" padding={20} className="fc-orderpanel fc-printable">
      <div className="fc-orderpanel__head">
        <div style={{ flex: 1 }}>
          <div className="fc-mono fc-orderpanel__meta">
            #{order.orderNumber}
            {order.placedAt ? ` · ${formatDate(order.placedAt, locale)}` : ''}
          </div>
          <div className="fc-orderpanel__title">{t('orderFrom', { name: buyerName })}</div>
        </div>
        <IconButton icon={X} label={t('close')} variant="fill" size={32} onClick={onClose} className="fc-noprint" />
      </div>
      <div>
        <StatusBadge status={order.status} />
      </div>

      <List header={t('deliverTo')}>
        <ListRow icon={User} title={order.recipientNameSnapshot} subtitle={<span className="fc-mono">{order.recipientPhonesSnapshot}</span>} />
        <ListRow icon={MapPin} iconBg="var(--red-500)" title={line} subtitle={[area, reference].filter(Boolean).join(' · ') || undefined} />
      </List>
      {order.giftMessage && (
        <List header={t('gift')}>
          <ListRow title={order.giftMessage} />
        </List>
      )}
      <List header={`${t('products')} · ${order.items.reduce((n, i) => n + i.quantity, 0)}`}>
        {order.items.map((item, i) => (
          <ListRow
            key={i}
            leading={
              <span className="fc-sumline__photo" style={{ width: 36, height: 36 }}>
                <Photo picture={item.productThumbUrl ? { thumbUrl: item.productThumbUrl, cardUrl: item.productThumbUrl } : null} alt="" variant="thumb" sizes="36px" radius={8} />
              </span>
            }
            title={localized(locale, item.productNameEs, item.productNameEn)}
            subtitle={`× ${item.quantity} · ${item.unitLabel}`}
            value={formatUsd(item.lineTotalCents)}
          />
        ))}
      </List>
      <Totals subtotalCents={order.subtotalCents} feeCents={order.deliveryFeeCents} />
      {order.paymentProvider === 'manual' && order.status !== 'cancelled' && (
        <PaymentReview
          orderId={id}
          orderNumber={order.orderNumber}
          totalCents={order.totalCents}
          report={order.paymentReport}
          pending={order.status === 'pending_payment'}
        />
      )}
      {order.status === 'delivered' && <DeliveryProofCard orderId={id} bare />}

      <div className="fc-orderpanel__actions fc-noprint">
        {error && (
          <div className="fc-auth__error" role="alert">
            {error}
          </div>
        )}
        {next && (
          <Button block iconRight={ArrowRight} loading={busy} onClick={() => run(next.run)}>
            {next.label}
          </Button>
        )}
        {isAdmin && order.status === 'pending_payment' && (
          <>
            <Button block variant="secondary" disabled={busy} onClick={() => setConfirm('markPaid')}>
              {t('markPaid')}
            </Button>
            <Button block variant="tinted" disabled={busy} onClick={() => setConfirm('cancel')}>
              {t('cancel')}
            </Button>
          </>
        )}
        <Button block variant="tinted" icon={Printer} onClick={() => window.print()}>
          {t('print')}
        </Button>
        {isAdmin && REFUNDABLE.includes(order.status) && (
          <Button block variant="destructive" disabled={busy} onClick={() => setConfirm('refund')}>
            {t('refund')}
          </Button>
        )}
      </div>

      <DeliverModal open={delivering} onClose={() => setDelivering(false)} orderId={id} orderNumber={order.orderNumber} recipientName={order.recipientNameSnapshot} />

      <Alert
        open={confirm !== null}
        title={confirm ? confirmCopy[confirm].title : ''}
        message={confirm ? confirmCopy[confirm].text : ''}
        cancelLabel={t('keep')}
        confirmLabel={confirm ? confirmCopy[confirm].label : ''}
        destructive={confirm !== 'markPaid'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirmCopy[confirm].go)}
      />
    </Card>
  );
}

/** The order queue (design: AdminOrders): filter, table, and a detail panel with the next action. */
export function AdminOrdersScreen() {
  const t = useTranslations('adm.orders');
  const ta = useTranslations('account.status');
  const locale = useLocale();
  const { data: orders = [], isLoading } = useGetAdminOrdersQuery(undefined, { pollingInterval: 60_000 });
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
      if (o.transferReported) map.set('transfer', (map.get('transfer') ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter(
      (o: AdminOrderListItem) =>
        (filter === 'all' || (filter === 'transfer' ? o.transferReported : o.status === filter)) &&
        (needle === '' ||
          [o.orderNumber, o.buyer?.fullName, o.buyer?.email, o.recipientNameSnapshot].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [orders, filter, query]);

  return (
    <>
      <AdminPageHead title={t('title')} />
      <div className="fc-orders">
        <div className="fc-orders__main">
          <div className="fc-orders__filters">
            <TextField icon={Search} type="search" className="fc-orders__search" placeholder={t('search')} aria-label={t('search')} value={query} onChange={setQuery} />
            <div className="fc-orders__pills">
              {FILTERS.map((f) => (
                <button key={f} type="button" className="fc-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? t('all') : f === 'transfer' ? t('transferFilter') : ta(f)}
                  {f !== 'all' && counts.get(f) ? ` · ${counts.get(f)}` : ''}
                </button>
              ))}
            </div>
          </div>

          <Card padding={0} style={{ overflowX: 'auto' }}>
            <table className="fc-table">
              <thead>
                <tr>
                  <th>{t('colOrder')}</th>
                  <th>{t('colCustomer')}</th>
                  <th>{t('colRecipient')}</th>
                  <th className="fc-table__num">{t('colItems')}</th>
                  <th className="fc-table__num">{t('colTotal')}</th>
                  <th>{t('colStatus')}</th>
                  <th>{t('colTime')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} aria-selected={o.id === selected} onClick={() => setSelected(o.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(o.id)}>
                    <td className="fc-mono" style={{ fontWeight: 500 }}>
                      #{o.orderNumber}
                    </td>
                    <td>{o.buyer?.fullName ?? o.buyer?.email ?? '—'}</td>
                    <td>{o.recipientNameSnapshot}</td>
                    <td className="fc-table__num">{o.itemCount}</td>
                    <td className="fc-table__num" style={{ fontWeight: 600 }}>
                      {formatUsd(o.totalCents)}
                    </td>
                    <td>
                      <StatusBadge status={o.status} size="sm" />
                      {o.transferReported && (
                        <>
                          {' '}
                          <Badge tone="warning" size="sm">{t('transferReported')}</Badge>
                        </>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-3)' }}>{o.placedAt ? formatDate(o.placedAt, locale) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && list.length === 0 && <div className="fc-table__empty">{t('empty')}</div>}
          </Card>
        </div>
        {selected && (
          <>
            <div className="fc-orderscrim fc-noprint" onClick={() => setSelected(null)} aria-hidden />
            <OrderPanel key={selected} id={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </div>
    </>
  );
}
