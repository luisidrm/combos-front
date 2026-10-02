'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutGrid, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { categoryIcon } from '@/lib/categoryIcons';
import { localized } from '@/lib/localized';
import type { Category, Product } from '@/store/api/catalogApi';
import { ProductCard } from './ProductCard';

// Search + category filter over the list the server already fetched. The whole
// active catalog is small (one shop, tens of products), so filtering in the
// browser is instant on a bad connection — no request per keystroke.
export function ShopBrowser({ categories, products }: { categories: Category[]; products: Product[] }) {
  const locale = useLocale();
  const t = useTranslations('shop');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (categoryId === null || p.categoryId === categoryId) &&
        (needle === '' || localized(locale, p.nameEs, p.nameEn).toLowerCase().includes(needle)),
    );
  }, [products, categoryId, query, locale]);

  return (
    <>
      <TextField icon={Search} type="search" className="fc-search" placeholder={t('search')} aria-label={t('search')} value={query} onChange={setQuery} />
      {categories.length > 0 && (
        <div className="fc-chips">
          <Chip active={categoryId === null} icon={LayoutGrid} onClick={() => setCategoryId(null)}>
            {t('all')}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={categoryId === c.id} icon={categoryIcon(c.icon)} onClick={() => setCategoryId(c.id)}>
              {localized(locale, c.nameEs, c.nameEn)}
            </Chip>
          ))}
        </div>
      )}
      {visible.length > 0 ? (
        <div className="fc-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <Card className="fc-empty">{products.length === 0 ? t('noProducts') : t('noResults')}</Card>
      )}
    </>
  );
}
