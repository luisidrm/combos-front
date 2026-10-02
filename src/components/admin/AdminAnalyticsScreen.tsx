'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminFrame';
import { Card } from '@/components/ui/Card';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { useDeliveryTerms } from '@/lib/useDeliveryTerms';
import { useGetSalesStatsQuery } from '@/store/api/ordersApi';
import type { SalesStats, StatsRange } from '@/store/api/ordersApi';

// Sales figures for the shop owner. Single-series bars in the brand accent: the busiest bucket is
// solid, the rest soft, every bar has a hover/focus tooltip, and the same numbers are available as
// a plain table (the "view as table" disclosure) so nothing depends on colour or on a mouse.

function bucketLabel(bucket: string, granularity: SalesStats['granularity'], locale: string, long = false): string {
  const date = new Date(`${bucket.length === 7 ? `${bucket}-01` : bucket}T12:00:00Z`);
  if (granularity === 'month') return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date);
  return new Intl.DateTimeFormat(locale, long ? { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' } : { weekday: 'short', timeZone: 'UTC' }).format(date);
}

/** Percent change vs the previous period; null when there is nothing to compare with. */
function change(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

function Delta({ value, suffix, label }: { value: number | null; suffix?: string; label: string }) {
  const t = useTranslations('adm.analytics');
  if (value === null) return <div className="fc-kpi__delta fc-kpi__delta--none">{t('noPrevious')}</div>;
  const up = value >= 0;
  const text = `${up ? '+' : '−'}${Math.abs(value * 100).toFixed(1)}${suffix ?? '%'}`;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className={`fc-kpi__delta ${up ? 'fc-kpi__delta--up' : 'fc-kpi__delta--down'}`}>
      <Icon size={14} aria-hidden />
      {text}
      <span className="fc-kpi__vs">{label}</span>
    </div>
  );
}

function Chart({ stats }: { stats: SalesStats }) {
  const t = useTranslations('adm.analytics');
  const locale = useLocale();
  const max = Math.max(1, ...stats.series.map((s) => s.totalCents));
  const peak = stats.series.reduce((best, s) => (s.totalCents > best.totalCents ? s : best), stats.series[0] ?? { bucket: '', totalCents: 0, orders: 0 });
  // A month of daily bars is too dense for a label under every one: label roughly every fifth.
  const every = stats.series.length > 14 ? 5 : 1;

  return (
    <div>
      <div className="fc-bars" role="img" aria-label={t('salesBy', { by: t(stats.granularity) })}>
        {stats.series.map((s, i) => {
          const tip = `${bucketLabel(s.bucket, stats.granularity, locale, true)} · ${formatUsd(s.totalCents)} · ${t('ordersCount', { count: s.orders })}`;
          return (
            <div key={s.bucket} className="fc-bars__col">
              <div className="fc-bars__value">{s.totalCents > 0 && stats.series.length <= 14 ? formatUsd(s.totalCents).replace(/\.00$/, '') : ''}</div>
              <div className="fc-bars__track">
                <div
                  className="fc-bars__bar"
                  data-peak={s === peak && s.totalCents > 0}
                  style={{ height: `${(s.totalCents / max) * 100}%` }}
                  tabIndex={0}
                  title={tip}
                  aria-label={tip}
                />
              </div>
              <div className="fc-bars__label">{i % every === 0 ? bucketLabel(s.bucket, stats.granularity, locale) : ''}</div>
            </div>
          );
        })}
      </div>
      <details className="fc-tableview">
        <summary>{t('viewAsTable')}</summary>
        <table className="fc-table">
          <thead>
            <tr>
              <th>{t(stats.granularity)}</th>
              <th className="fc-table__num">{t('sales')}</th>
              <th className="fc-table__num">{t('orders')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.series.map((s) => (
              <tr key={s.bucket}>
                <td>{bucketLabel(s.bucket, stats.granularity, locale, true)}</td>
                <td className="fc-table__num">{formatUsd(s.totalCents)}</td>
                <td className="fc-table__num">{s.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Analytics (design: AdminStats): KPIs against the previous period, sales over time, places, top products. */
export function AdminAnalyticsScreen() {
  const t = useTranslations('adm.analytics');
  const locale = useLocale();
  const [range, setRange] = useState<StatsRange>('week');
  const { data: stats } = useGetSalesStatsQuery(range);
  const { zones } = useDeliveryTerms();

  const places = new Map(zones.map((z) => [z.municipalityId, localized(locale, z.municipality.nameEs, z.municipality.nameEn)]));
  const vs = t(`vs.${range}`);

  return (
    <>
      <AdminPageHead title={t('title')} />
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <SegmentedControl<StatsRange>
            label={t('title')}
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: t('week') },
              { value: 'month', label: t('month') },
              { value: 'year', label: t('year') },
            ]}
          />
        </div>

        {stats && (
          <>
            <div className="fc-kpis">
              <Card>
                <div className="fc-kpi__label">{t('sales')}</div>
                <div className="fc-kpi__value">{formatUsd(stats.current.totalCents)}</div>
                <Delta value={change(stats.current.totalCents, stats.previous.totalCents)} label={vs} />
              </Card>
              <Card>
                <div className="fc-kpi__label">{t('orders')}</div>
                <div className="fc-kpi__value">{stats.current.orders}</div>
                <Delta value={change(stats.current.orders, stats.previous.orders)} label={vs} />
              </Card>
              <Card>
                <div className="fc-kpi__label">{t('averageTicket')}</div>
                <div className="fc-kpi__value">{formatUsd(stats.current.averageTicketCents)}</div>
                <Delta value={change(stats.current.averageTicketCents, stats.previous.averageTicketCents)} label={vs} />
              </Card>
              <Card>
                <div className="fc-kpi__label">{t('freeDelivery')}</div>
                <div className="fc-kpi__value">{Math.round(stats.current.freeDeliveryShare * 100)}%</div>
                <Delta
                  value={stats.previous.orders === 0 ? null : stats.current.freeDeliveryShare - stats.previous.freeDeliveryShare}
                  suffix=" pp"
                  label={vs}
                />
              </Card>
            </div>

            <div className="fc-statsgrid">
              <Card padding={20}>
                <div className="fc-statscard__title">{t('salesBy', { by: t(stats.granularity) })}</div>
                <Chart stats={stats} />
              </Card>
              <Card padding={20}>
                <div className="fc-statscard__title">{t('byPlace')}</div>
                {stats.byMunicipality.length === 0 ? (
                  <div className="fc-note">{t('noData')}</div>
                ) : (
                  <div className="fc-hbars">
                    {stats.byMunicipality.slice(0, 8).map((row) => (
                      <div key={row.municipalityId} className="fc-hbars__row">
                        <span className="fc-hbars__name">{places.get(row.municipalityId) ?? '—'}</span>
                        <div className="fc-hbars__track">
                          <div className="fc-hbars__bar" style={{ width: `${(row.orders / (stats.byMunicipality[0]?.orders ?? 1)) * 100}%` }} />
                        </div>
                        <span className="fc-hbars__n">{row.orders}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div style={{ maxWidth: 720 }}>
              <List header={t('topProducts')}>
                {stats.topProducts.length === 0 ? (
                  <ListRow title={t('noData')} />
                ) : (
                  stats.topProducts.map((p) => (
                    <ListRow
                      key={`${p.productId}-${p.nameEs}`}
                      title={localized(locale, p.nameEs, p.nameEn)}
                      subtitle={t('sold', { count: p.quantity })}
                      value={formatUsd(p.totalCents)}
                    />
                  ))
                )}
              </List>
            </div>
          </>
        )}
      </div>
    </>
  );
}
