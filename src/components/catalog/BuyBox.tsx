'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircleCheck, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCartActions } from '@/components/cart/useCartActions';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { formatUsd } from '@/lib/format';

interface BuyBoxProps {
  productId: string;
  priceCents: number;
  maxPerOrder: number | null;
  out: boolean;
}

/** Quantity + "add to combo" for the product page (design: product.jsx). Sets the quantity in the server cart. */
export function BuyBox({ productId, priceCents, maxPerOrder, out }: BuyBoxProps) {
  const t = useTranslations('product');
  const ts = useTranslations('shop');
  const { quantityOf, setQuantity, busy } = useCartActions();
  const inCart = quantityOf(productId);
  const [picked, setPicked] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const max = Math.min(99, maxPerOrder ?? 99);
  // Until the buyer touches the stepper it mirrors what is already in their combo.
  const qty = Math.min(max, picked ?? (inCart || 1));

  return (
    <>
      <div className="fc-pdp__buy">
        <Stepper
          min={1}
          max={max}
          value={qty}
          disabled={out}
          labels={{ less: ts('less'), more: ts('more') }}
          onChange={(v) => {
            setPicked(v);
            setAdded(false);
          }}
        />
        <Button
          size="lg"
          icon={ShoppingBag}
          disabled={out}
          loading={busy}
          onClick={async () => {
            await setQuantity(productId, qty);
            setAdded(true);
          }}
        >
          {out ? ts('out') : `${inCart ? t('updateCombo') : t('addToCombo')} · ${formatUsd(priceCents * qty)}`}
        </Button>
      </div>
      {added && inCart > 0 && (
        <div className="fc-pdp__added" role="status">
          <CircleCheck size={18} aria-hidden />
          {t('inCombo', { count: inCart })}
          <Link href="/cart" style={{ marginLeft: 6 }}>
            {t('viewCombo')}
          </Link>
        </div>
      )}
      {maxPerOrder != null && <div className="fc-pdp__note">{ts('maxReached', { max: maxPerOrder })}</div>}
    </>
  );
}
