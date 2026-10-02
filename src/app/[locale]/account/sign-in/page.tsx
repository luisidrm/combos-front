import { setRequestLocale } from 'next-intl/server';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { apiFetch } from '@/lib/apiFetch';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import type { DeliveryZone } from '@/store/api/geoApi';
import type { PublicTenant } from '@/store/api/tenancyApi';

// Login / sign-up. The design shows this screen without the site header or tab
// bar, so they are hidden for this page only (plain CSS in the server output:
// no flash, and it disappears again on navigation).
export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [zones, tenant] = await Promise.all([
    apiFetch<DeliveryZone[]>('/geo/delivery-zones').catch(() => [] as DeliveryZone[]),
    apiFetch<PublicTenant>('/tenancy/current').catch(() => null),
  ]);
  const places = [...new Set(zones.map((z) => localized(locale, z.municipality.nameEs, z.municipality.nameEn)))];

  return (
    <>
      <style>{'.fc-header,.fc-tabbar{display:none!important}.fc-main{padding-bottom:0!important}'}</style>
      <AuthScreen place={places.join(', ') || 'Cuba'} freeOver={tenant?.freeDeliveryOverCents != null ? formatUsd(tenant.freeDeliveryOverCents) : null} />
    </>
  );
}
