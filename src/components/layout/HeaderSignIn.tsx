'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useGetMeQuery } from '@/store/api/identityApi';

/**
 * "Sign in" at the right end of the header, on the landing page only and only for visitors who are
 * not signed in (everyone else already has "My orders" in the nav). Renders nothing until we know
 * who is looking, so a signed-in person never sees it flash.
 */
export function HeaderSignIn() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { isError } = useGetMeQuery();
  if (pathname !== '/' || !isError) return null;

  return (
    <Link href="/account/sign-in" className="fc-btn fc-btn--primary">
      {t('signIn')}
    </Link>
  );
}
