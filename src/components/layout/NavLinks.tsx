'use client';

import { useTranslations } from 'next-intl';
import { Package, ShoppingBag, Store, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useCartActions } from '@/components/cart/useCartActions';

// Shell links: orders → /account, profile → /account/profile.
const ITEMS: Array<{ key: 'shop' | 'cart' | 'orders' | 'profile'; href: string; icon: LucideIcon; match: (p: string) => boolean }> = [
  { key: 'shop', href: '/shop', icon: Store, match: (p) => p.startsWith('/shop') || p.startsWith('/products') },
  { key: 'cart', href: '/cart', icon: ShoppingBag, match: (p) => p.startsWith('/cart') || p.startsWith('/checkout') },
  { key: 'orders', href: '/account', icon: Package, match: (p) => p === '/account' || p.startsWith('/account/orders') },
  { key: 'profile', href: '/account/profile', icon: User, match: (p) => p.startsWith('/account/profile') },
];

/** Desktop header links: Tienda / Mis pedidos / Perfil. */
export function NavLinks() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <nav className="fc-nav" aria-label={t('main')}>
      {ITEMS.filter((i) => i.key !== 'cart').map(({ key, href, icon: Icon, match }) => (
        <Link key={key} href={href} className="fc-navlink" aria-current={match(pathname) ? 'page' : undefined}>
          <Icon size={16} aria-hidden />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}

/** Phone-only floating glass tab bar. */
export function MobileTabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { cart } = useCartActions();
  const count = cart?.itemCount ?? 0;
  const labels = { shop: t('shop'), cart: t('comboShort'), orders: t('ordersShort'), profile: t('profile') };
  return (
    <nav className="fc-tabbar" aria-label={t('main')}>
      {ITEMS.map(({ key, href, icon: Icon, match }) => (
        <Link key={key} href={href} className="fc-tab" aria-current={match(pathname) ? 'page' : undefined}>
          <Icon size={22} aria-hidden />
          <span>{labels[key]}</span>
          {key === 'cart' && count > 0 && <span className="fc-tab__badge">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}
