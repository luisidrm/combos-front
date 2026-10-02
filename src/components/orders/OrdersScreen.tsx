'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Package, Store } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ACTIVE_STATUSES, StatusBadge } from '@/components/orders/StatusBadge';
import { PageHead } from '@/components/layout/PageHead';
import { Card } from '@/components/ui/Card';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { formatDate, formatUsd } from '@/lib/format';
import { useRequireRole } from '@/lib/useRequireRole';
import { useGetOrdersQuery } from '@/store/api/ordersApi';

type Tab = 'active' | 'past';

/** The buyer's orders, split into in-progress and finished (design: History). */
export function OrdersScreen() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { isReady } = useRequireRole('buyer', '/account/sign-in');
  const { data: orders, isLoading } = useGetOrdersQuery(undefined, { skip: !isReady });
  const [tab, setTab] = useState<Tab>('active');

  const list = (orders ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status) === (tab === 'active'));

  return (
    <div className="fc-page">
      <PageHead title={t('title')} />
      <div className="fc-ordersbox">
        <SegmentedControl<Tab>
          size="md"
          label={t('title')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: t('active') },
            { value: 'past', label: t('past') },
          ]}
        />
        {isLoading || !isReady ? null : list.length > 0 ? (
          <List>
            {list.map((o) => (
              <ListRow
                key={o.id}
                href={`/account/orders/${o.id}`}
                icon={Package}
                title={t('forName', { name: o.recipientNameSnapshot })}
                subtitle={
                  <span>
                    <span className="fc-mono">#{o.orderNumber}</span>
                    {o.placedAt ? ` · ${formatDate(o.placedAt, locale)}` : ''} · {formatUsd(o.totalCents)}
                  </span>
                }
                accessory={<StatusBadge status={o.status} size="sm" />}
              />
            ))}
          </List>
        ) : (
          <Card className="fc-emptycard" style={{ maxWidth: 'none' }}>
            <div className="fc-emptycard__text">{tab === 'active' ? t('noActive') : t('noPast')}</div>
            <Link href="/shop" className="fc-btn fc-btn--secondary">
              <Store size={18} aria-hidden />
              {t('build')}
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
