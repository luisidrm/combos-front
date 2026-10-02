import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, CircleCheck, Package, Truck } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { Link } from '@/i18n/navigation';
import { BuyBox } from '@/components/catalog/BuyBox';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Badge } from '@/components/ui/Badge';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { Photo } from '@/components/ui/Photo';
import type { Category, Product, ProductDetail } from '@/store/api/catalogApi';
import type { DeliveryZone } from '@/store/api/geoApi';
import type { PublicTenant } from '@/store/api/tenancyApi';

// Product detail (design: product.jsx). Fetched on the server (CLAUDE.md section 7);
// only the quantity / add-to-combo box and the related cards are client islands.
export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('product');
  const ts = await getTranslations('shop');

  const product = await apiFetch<ProductDetail>(`/catalog/products/${slug}`).catch(() => null);
  if (!product) {
    notFound();
  }

  const [categories, zones, tenant, sameCategory] = await Promise.all([
    apiFetch<Category[]>('/catalog/categories').catch(() => [] as Category[]),
    apiFetch<DeliveryZone[]>('/geo/delivery-zones').catch(() => [] as DeliveryZone[]),
    apiFetch<PublicTenant>('/tenancy/current').catch(() => null),
    product.categoryId
      ? apiFetch<Product[]>(`/catalog/products?categoryId=${product.categoryId}`).catch(() => [] as Product[])
      : Promise.resolve([] as Product[]),
  ]);

  const name = localized(locale, product.nameEs, product.nameEn);
  const description = localized(locale, product.descriptionEs ?? '', product.descriptionEn);
  const category = categories.find((c) => c.id === product.categoryId);
  const categoryName = category ? localized(locale, category.nameEs, category.nameEn) : null;
  const related = sameCategory.filter((p) => p.id !== product.id).slice(0, 4);
  const places = [...new Set(zones.map((z) => localized(locale, z.municipality.nameEs, z.municipality.nameEn)))];
  const zoneFee = zones.length ? Math.min(...zones.map((z) => z.feeCents)) : null;
  const freeOver = tenant?.freeDeliveryOverCents ?? null;
  const out = product.stockStatus === 'out';
  const cover = product.pictures.find((p) => p.isCover) ?? product.pictures[0] ?? null;

  return (
    <div className="fc-page">
      <Link href="/shop" className="fc-back" style={{ marginBottom: 18 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('back')}
        {categoryName ? ` / ${categoryName}` : ''}
      </Link>

      <div className="fc-pdp">
        <div className="fc-pdp__photo">
          <Photo picture={cover} alt={name} sizes="(min-width: 900px) 600px, 100vw" radius={28} priority />
        </div>
        <div className="fc-pdp__info">
          <div className="fc-pdp__head">
            {categoryName && <Badge tone="neutral">{categoryName}</Badge>}
            <h1 className="fc-pdp__title">{name}</h1>
            <div className="fc-pdp__unit">{product.unitLabel}</div>
            <div className="fc-pdp__price">{formatUsd(product.priceCents)}</div>
          </div>
          {description && <p className="fc-pdp__desc">{description}</p>}

          <BuyBox productId={product.id} priceCents={product.priceCents} maxPerOrder={product.maxPerOrder} out={out} />

          <List>
            <ListRow
              icon={Truck}
              title={t('sameDay')}
              subtitle={places.length ? t('onlyIn', { place: places.join(', ') }) : undefined}
            />
            {freeOver !== null && (
              <ListRow
                icon={CircleCheck}
                iconBg="var(--blue-500)"
                title={t('freeOver', { amount: formatUsd(freeOver) })}
                subtitle={zoneFee != null ? t('otherwise', { fee: formatUsd(zoneFee) }) : undefined}
              />
            )}
            <ListRow
              icon={Package}
              iconBg="var(--gray-700)"
              title={t('availability')}
              value={out ? ts('out') : product.stockStatus === 'limited' ? ts('limited') : t('inStock')}
            />
          </List>
        </div>
      </div>

      {related.length > 0 && categoryName && (
        <section className="fc-related">
          <h2 className="fc-related__title">{t('alsoIn', { category: categoryName })}</h2>
          <div className="fc-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
