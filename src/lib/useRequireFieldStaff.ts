'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGetMeQuery } from '@/store/api/identityApi';

/** Gate for the courier view: a courier, or the owner / packer covering for one. Anyone else goes to the login. */
export function useRequireFieldStaff() {
  const router = useRouter();
  const { data: me, isLoading, isError } = useGetMeQuery();
  const allowed = me?.role === 'courier' || me?.role === 'admin' || me?.role === 'staff';

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me || !allowed) router.replace('/account/sign-in');
  }, [isLoading, isError, me, allowed, router]);

  return { me, isReady: !isLoading && allowed };
}
