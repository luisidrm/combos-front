'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGetMeQuery } from '@/store/api/identityApi';
import type { Me } from '@/store/api/identityApi';

// Client-side gate for the SPA sections (account/admin/courier). The API
// itself is the real authority — this only avoids flashing protected UI
// before redirecting; every request is still re-checked server-side
// (CLAUDE.md section 7's "re-reads the caller's account on every request").
export function useRequireRole(role: Me['role'], redirectTo: string) {
  const router = useRouter();
  const { data: me, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me || me.role !== role) {
      router.replace(redirectTo);
    }
  }, [isLoading, isError, me, role, redirectTo, router]);

  return { me, isLoading, isReady: !isLoading && me?.role === role };
}
