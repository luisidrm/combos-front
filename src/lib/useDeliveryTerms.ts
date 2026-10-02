'use client';

import { useGetDeliveryZonesQuery } from '@/store/api/geoApi';
import { useGetCurrentTenantQuery } from '@/store/api/tenancyApi';

/** The store's delivery terms for client components: cheapest zone fee and the free-delivery threshold. */
export function useDeliveryTerms() {
  const { data: zones } = useGetDeliveryZonesQuery();
  const { data: tenant } = useGetCurrentTenantQuery();
  return {
    zoneFeeCents: zones?.length ? Math.min(...zones.map((z) => z.feeCents)) : null,
    freeOverCents: tenant?.freeDeliveryOverCents ?? null,
    zones: zones ?? [],
  };
}
