'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminPageHead } from '@/components/admin/AdminFrame';
import { SettingsCategoriesTab } from '@/components/admin/SettingsCategoriesTab';
import { SettingsShopTab } from '@/components/admin/SettingsShopTab';
import { SettingsZonesTab } from '@/components/admin/SettingsZonesTab';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useGetAdminSettingsQuery, useGetCurrentTenantQuery } from '@/store/api/tenancyApi';

type Tab = 'shop' | 'zones' | 'categories';

/**
 * Store settings (design: AdminSettings), admin only. The design's "Payouts" and "Notifications"
 * tabs are not here: nothing in the backend backs them yet, and a switch that does nothing is worse
 * than no switch (see the gap list in CLAUDE.md).
 */
export function AdminSettingsScreen() {
  const t = useTranslations('adm.settings');
  const [tab, setTab] = useState<Tab>('shop');
  const { data: tenant } = useGetCurrentTenantQuery();
  const { data: settings } = useGetAdminSettingsQuery();

  return (
    <>
      <AdminPageHead title={t('title')} />
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <SegmentedControl<Tab>
            size="md"
            label={t('title')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'shop', label: t('tabShop') },
              { value: 'zones', label: t('tabZones') },
              { value: 'categories', label: t('tabCategories') },
            ]}
          />
        </div>
        {/* The forms start from the loaded values, so they mount only once those exist. */}
        {tab === 'shop' && tenant && settings && <SettingsShopTab key={tenant.slug} tenant={tenant} settings={settings} />}
        {tab === 'zones' && settings && <SettingsZonesTab settings={settings} />}
        {tab === 'categories' && <SettingsCategoriesTab />}
      </div>
    </>
  );
}
