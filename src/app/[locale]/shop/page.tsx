import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CircleCheck, Clock, Truck } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { Card } from '@/components/ui/Card';
import { ComboBar, ComboPanel } from '@/components/catalog/ComboPanel';
import { ShopBrowser } from '@/components/catalog/ShopBrowser';
import type { Category, Product } from '@/store/api/catalogApi';
import type { DeliveryZone } from '@/store/api/geoApi';
import type { PublicTenant } from '@/store/api/tenancyApi';

// Shop screen (design: shop.jsx). Catalog data is fetched here, on the server, with
// plain fetch (CLAUDE.md section 7: storefront = RSC, no RTK Query). The combo panel
// and add/stepper controls are client islands over the server cart.
export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shop');

  const [categories, products, zones, tenant] = await Promise.all([
    apiFetch<Category[]>('/catalog/categories').catch(() => null),
    apiFetch<Product[]>('/catalog/products').catch(() => null),
    apiFetch<DeliveryZone[]>('/geo/delivery-zones').catch(() => [] as DeliveryZone[]),
    apiFetch<PublicTenant>('/tenancy/current').catch(() => null),
  ]);

  // Where we deliver comes from the shop's active delivery zones, not from copy.
  const places = [...new Set(zones.map((z) => localized(locale, z.municipality.nameEs, z.municipality.nameEn)))];
  const freeOver = tenant?.freeDeliveryOverCents ?? null;
  // "HH:MM" Cuba time -> a clock time in the viewer's format ("2:00 p.m.").
  const cutoff = tenant?.sameDayCutoff
    ? new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'UTC' }).format(new Date(`1970-01-01T${tenant.sameDayCutoff}:00Z`))
    : null;

  return (
    <div className="fc-page">
      <div className="fc-shop">
        <div className="fc-shop__main">
          <div style={{ display: 'grid', gap: 8 }}>
            <h1 className="fc-shop__title">{t('title')}</h1>
            <div className="fc-shop__perks">
              {places.length > 0 && (
                <span className="fc-shop__perk">
                  <Truck size={16} aria-hidden />
                  {t('sameDay', { place: places.join(', ') })}
                </span>
              )}
              {cutoff && (
                <span className="fc-shop__perk">
                  <Clock size={16} aria-hidden />
                  {t('cutoff', { time: cutoff })}
                </span>
              )}
              {freeOver !== null && (
                <span className="fc-shop__perk">
                  <CircleCheck size={16} aria-hidden />
                  {t('freeOver', { amount: formatUsd(freeOver) })}
                </span>
              )}
            </div>
          </div>

          {products === null ? (
            <Card className="fc-empty" role="alert">
              {t('loadError')}
            </Card>
          ) : (
            <ShopBrowser categories={categories ?? []} products={products} />
          )}
        </div>
        <ComboPanel />
      </div>
      <ComboBar />
    </div>
  );
}
