'use client';

import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useGetCartQuery } from '@/store/api/cartApi';

// A small client island inside the (otherwise server-rendered) storefront
// header. It needs live cart state, so it alone uses RTK Query — the
// surrounding page stays RSC-fetched. Loading/error states collapse to
// just the icon so a slow or failed cart fetch never blocks the header.
export function CartBadge() {
  const t = useTranslations('nav');
  const { data } = useGetCartQuery();
  const count = data?.itemCount ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={t('combo')}
      title={t('combo')}
      className="fc-iconbtn fc-iconbtn--fill fc-wide-only"
      style={{ ['--s' as string]: '40px' }}
    >
      <ShoppingBag size={19} aria-hidden />
      {count > 0 && <span className="fc-iconbtn__badge">{count}</span>}
    </Link>
  );
}
