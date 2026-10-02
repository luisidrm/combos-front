'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGetMeQuery } from '@/store/api/identityApi';

/**
 * Gate for the dashboard: admin or staff (the packer). Anyone else — a guest, a buyer — is sent to
 * the login. `adminOnly` pages (analytics, settings) send staff back to the order queue instead.
 * Like useRequireRole this only avoids flashing protected UI; the API re-checks every request.
 */
export function useRequireStaff(adminOnly = false) {
  const router = useRouter();
  const { data: me, isLoading, isError } = useGetMeQuery();
  const isStaff = me?.role === 'admin' || me?.role === 'staff';
  const allowed = isStaff && (!adminOnly || me?.role === 'admin');

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me || !isStaff) router.replace('/account/sign-in');
    else if (!allowed) router.replace('/admin/orders');
  }, [isLoading, isError, me, isStaff, allowed, router]);

  return { me, isAdmin: me?.role === 'admin', isReady: !isLoading && allowed };
}
