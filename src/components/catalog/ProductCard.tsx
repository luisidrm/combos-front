'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCartActions } from '@/components/cart/useCartActions';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Photo } from '@/components/ui/Photo';
import { Stepper } from '@/components/ui/Stepper';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import type { Product } from '@/store/api/catalogApi';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations('shop');
  const { quantityOf, setQuantity, busy } = useCartActions();

  const name = localized(locale, product.nameEs, product.nameEn);
  const quantity = quantityOf(product.id);
  const out = product.stockStatus === 'out';
  const max = Math.min(99, product.maxPerOrder ?? 99);
  const href = `/products/${product.slug}`;

  return (
    <Card padding={8} className={`fc-product${out ? ' fc-product--out' : ''}`}>
      <Link href={href} className="fc-product__photo" tabIndex={-1} aria-hidden>
        <Photo picture={product.cover} alt={name} sizes="(min-width: 900px) 220px, 50vw" />
      </Link>
      {(out || product.stockStatus === 'limited') && (
        <span className="fc-product__tag">
          <Badge tone={out ? 'neutral' : 'warning'} size="sm">
            {out ? t('out') : t('limited')}
          </Badge>
        </span>
      )}
      <div className="fc-product__text">
        <Link href={href} className="fc-product__name">
          {name}
        </Link>
        <div className="fc-product__unit">{product.unitLabel}</div>
      </div>
      <div className="fc-product__foot">
        <span className="fc-price">{formatUsd(product.priceCents)}</span>
        {quantity > 0 ? (
          <Stepper
            size="sm"
            min={0}
            max={max}
            value={quantity}
            disabled={busy}
            labels={{ less: t('less'), more: t('more') }}
            onChange={(next) => setQuantity(product.id, next)}
          />
        ) : (
          <IconButton
            icon={Plus}
            variant="primary"
            size={34}
            label={t('add')}
            disabled={out || busy}
            onClick={() => setQuantity(product.id, 1)}
          />
        )}
      </div>
    </Card>
  );
}
