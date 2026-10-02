import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Landing } from '@/components/landing/Landing';
import { apiFetch } from '@/lib/apiFetch';
import type { Category, Product } from '@/store/api/catalogApi';
import type { DeliveryZone } from '@/store/api/geoApi';
import type { PublicTenant } from '@/store/api/tenancyApi';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  return { title: t('title'), description: t('description') };
}

// The front door. Server-rendered from the public API (CLAUDE.md section 7: storefront = RSC), so
// the delivery areas, fees, hours and contact it shows are the shop's own settings.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tenant, categories, products, zones] = await Promise.all([
    apiFetch<PublicTenant>('/tenancy/current').catch(() => null),
    apiFetch<Category[]>('/catalog/categories').catch(() => [] as Category[]),
    apiFetch<Product[]>('/catalog/products').catch(() => [] as Product[]),
    apiFetch<DeliveryZone[]>('/geo/delivery-zones').catch(() => [] as DeliveryZone[]),
  ]);

  return <Landing tenant={tenant} categories={categories} products={products} zones={zones} />;
}
