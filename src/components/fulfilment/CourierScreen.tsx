'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, MapPin, Phone } from 'lucide-react';
import { DeliverModal } from '@/components/fulfilment/DeliverModal';
import { useAddressText } from '@/components/orders/useAddressText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHead } from '@/components/layout/PageHead';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { useRouter } from '@/i18n/navigation';
import { useRequireFieldStaff } from '@/lib/useRequireFieldStaff';
import { useSignOutMutation } from '@/store/api/authApi';
import { useGetDeliveryQueueQuery } from '@/store/api/fulfilmentApi';
import type { AdminOrderListItem } from '@/store/api/ordersApi';

function DeliveryCard({ order }: { order: AdminOrderListItem }) {
  const t = useTranslations('fulfil.courier');
  const [open, setOpen] = useState(false);
  const { line, area, reference } = useAddressText(order.addressSnapshot);
  // The phones are one free-text field ("5 1234567 / 5 7654321"); the first number is the one to dial.
  const dial = order.recipientPhonesSnapshot.split(/[\/,;]/)[0]?.replace(/[^\d+]/g, '') ?? '';

  return (
    <Card padding={16} style={{ display: 'grid', gap: 12 }}>
      <div className="fc-mono fc-orderpanel__meta">#{order.orderNumber}</div>
      <List>
        <ListRow title={order.recipientNameSnapshot} subtitle={<span className="fc-mono">{order.recipientPhonesSnapshot}</span>} />
        <ListRow icon={MapPin} iconBg="var(--red-500)" title={line} subtitle={[area, reference].filter(Boolean).join(' · ') || undefined} />
      </List>
      <div style={{ display: 'flex', gap: 8 }}>
        {dial && (
          <a className="fc-btn fc-btn--secondary fc-btn--lg" href={`tel:${dial}`} style={{ flex: '0 0 auto' }} aria-label={t('call')}>
            <Phone size={18} aria-hidden />
          </a>
        )}
        <Button size="lg" style={{ flex: 1 }} onClick={() => setOpen(true)}>
          {t('markDelivered')}
        </Button>
      </div>
      <DeliverModal open={open} onClose={() => setOpen(false)} orderId={order.id} orderNumber={order.orderNumber} recipientName={order.recipientNameSnapshot} />
    </Card>
  );
}

/**
 * The courier's day (design: mobile): the orders out for delivery, call the recipient, hand over
 * with a photo. Online only for now — the offline queue with Background Sync is the rest of M4.
 */
export function CourierScreen() {
  const t = useTranslations('fulfil.courier');
  const router = useRouter();
  const { isReady } = useRequireFieldStaff();
  const [signOut] = useSignOutMutation();
  const { data: queue = [], isLoading } = useGetDeliveryQueueQuery(undefined, { skip: !isReady, pollingInterval: 60_000 });

  if (!isReady) return null;

  return (
    <div className="fc-page" style={{ maxWidth: 560 }}>
      <PageHead title={t('title')} sub={t('count', { count: queue.length })} />
      <div style={{ display: 'grid', gap: 14 }}>
        {queue.map((order) => (
          <DeliveryCard key={order.id} order={order} />
        ))}
        {!isLoading && queue.length === 0 && <div className="fc-note">{t('empty')}</div>}
        <Button variant="tinted" icon={LogOut} onClick={() => signOut().then(() => router.replace('/account/sign-in'))}>
          {t('signOut')}
        </Button>
      </div>
    </div>
  );
}
