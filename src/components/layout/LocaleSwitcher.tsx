'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { AppLocale } from '@/i18n/routing';

/** `always` shows it on phones too (the header hides it below 900px; the profile screen carries it there). */
export function LocaleSwitcher({ always }: { always?: boolean }) {
  const t = useTranslations('nav');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={always ? undefined : 'fc-wide-only'}>
      <SegmentedControl<AppLocale>
        label={t('language')}
        value={locale}
        onChange={(next) => router.replace(pathname, { locale: next })}
        options={[
          { value: 'es', label: 'ES' },
          { value: 'en', label: 'EN' },
        ]}
      />
    </div>
  );
}
