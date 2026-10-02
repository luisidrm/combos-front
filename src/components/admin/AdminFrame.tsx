'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChartLine, LayoutGrid, LogOut, Package, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useRequireStaff } from '@/lib/useRequireStaff';
import { useSignOutMutation } from '@/store/api/authApi';
import { useGetAdminOrdersQuery } from '@/store/api/ordersApi';
import { useGetCurrentTenantQuery } from '@/store/api/tenancyApi';

interface NavItem {
  key: 'orders' | 'products' | 'analytics' | 'settings';
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { key: 'orders', href: '/admin/orders', icon: Package },
  { key: 'products', href: '/admin/products', icon: LayoutGrid },
  { key: 'analytics', href: '/admin/analytics', icon: ChartLine, adminOnly: true },
  { key: 'settings', href: '/admin/settings', icon: Settings, adminOnly: true },
];

/**
 * The dashboard chrome (design: AdminShell): a glass sidebar on wide screens, a header with chips on
 * phones. It replaces the storefront header and tab bar, which are hidden for the whole admin area.
 * The adminOnly pages (analytics, settings) are gated here too, so the packer never even sees their links.
 */
export function AdminFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('adm');
  const router = useRouter();
  const pathname = usePathname();
  const { me, isAdmin, isReady } = useRequireStaff(ITEMS.some((item) => item.adminOnly && pathname.startsWith(item.href)));
  const { data: tenant } = useGetCurrentTenantQuery();
  const [signOut] = useSignOutMutation();
  // The badge counts paid orders still waiting to be prepared — the packer's to-do list.
  const { data: orders } = useGetAdminOrdersQuery(undefined, { skip: !isReady, pollingInterval: 60_000 });
  const toPrepare = (orders ?? []).filter((o) => o.status === 'paid').length;

  if (!isReady || !me) {
    return <div className="fc-adminloading" />;
  }

  const items = ITEMS.filter((item) => isAdmin || !item.adminOnly);
  const active = (href: string) => pathname.startsWith(href);
  const logOut = async () => {
    try {
      await signOut().unwrap();
    } finally {
      router.replace('/account/sign-in');
    }
  };

  const brand = (
    <div>
      <div className="fc-wordmark">food-combos</div>
      {tenant && <div className="fc-sidebar__shop">{tenant.name}</div>}
    </div>
  );

  return (
    <div className="fc-admin">
      {/* The storefront header / tab bar have no place here. */}
      <style>{'.fc-header,.fc-tabbar{display:none!important}.fc-main{padding-bottom:0!important}'}</style>

      <aside className="fc-sidebar fc-glass">
        <div className="fc-sidebar__brand">{brand}</div>
        <nav aria-label={t('nav.main')} className="fc-sidebar__nav">
          {items.map((item, i) => (
            <div key={item.key} style={{ display: 'contents' }}>
              {item.adminOnly && !items[i - 1]?.adminOnly && <div className="fc-sidebar__section">{t('nav.business')}</div>}
              <Link href={item.href} className="fc-sidebar__item" aria-current={active(item.href) ? 'page' : undefined}>
                <item.icon size={18} aria-hidden />
                <span style={{ flex: 1 }}>{t(`nav.${item.key}`)}</span>
                {item.key === 'orders' && toPrepare > 0 && <span className="fc-sidebar__count">{toPrepare}</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div className="fc-sidebar__user">
          <span className="fc-avatar fc-avatar--sm" aria-hidden>
            {(me.fullName ?? me.email).charAt(0).toUpperCase()}
          </span>
          <div className="fc-sidebar__who">
            <div className="fc-sidebar__name">{me.fullName ?? me.email}</div>
            <div className="fc-sidebar__role">{t(isAdmin ? 'nav.roleAdmin' : 'nav.roleStaff')}</div>
          </div>
          <button type="button" className="fc-iconbtn fc-iconbtn--plain" style={{ ['--s' as string]: '34px' }} aria-label={t('nav.logout')} title={t('nav.logout')} onClick={logOut}>
            <LogOut size={16} aria-hidden />
          </button>
        </div>
      </aside>

      <header className="fc-adminbar fc-glass">
        {brand}
        <div style={{ flex: 1 }} />
        <LocaleSwitcher always />
        <ThemeToggle />
        <button type="button" className="fc-iconbtn fc-iconbtn--plain" style={{ ['--s' as string]: '38px' }} aria-label={t('nav.logout')} onClick={logOut}>
          <LogOut size={18} aria-hidden />
        </button>
        <nav className="fc-adminbar__chips" aria-label={t('nav.main')}>
          {items.map((item) => (
            <Link key={item.key} href={item.href} className="fc-chip" aria-pressed={active(item.href)}>
              <item.icon size={16} aria-hidden />
              {t(`nav.${item.key}`)}
              {item.key === 'orders' && toPrepare > 0 ? ` · ${toPrepare}` : ''}
            </Link>
          ))}
        </nav>
      </header>

      <main className="fc-adminmain">{children}</main>
    </div>
  );
}

/** Title row of a dashboard page: heading, page actions, then the language / theme switches (wide screens). */
export function AdminPageHead({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="fc-adminhead">
      <h1 className="fc-adminhead__title">{title}</h1>
      {actions}
      <div className="fc-adminhead__tools">
        <LocaleSwitcher always />
        <ThemeToggle />
      </div>
    </div>
  );
}
