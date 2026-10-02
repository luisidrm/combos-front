import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { PublicPicture } from '@/types/media';

export interface PublicTenant {
  slug: string;
  name: string;
  taglineEs: string | null;
  taglineEn: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  logo: PublicPicture | null;
  /** "Free delivery from $X" in cents; null = the store does not offer it. */
  freeDeliveryOverCents: number | null;
  /** Orders placed before this Cuba time ("HH:MM") are delivered the same day. */
  sameDayCutoff: string | null;
  contact: StoreContact;
  /** Monday first; null entry = closed that day; null = not set. */
  openingHours: OpeningHours | null;
}

export type OpeningHours = Array<{ open: string; close: string } | null>;
export interface StoreContact {
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface TenantSettings {
  requireDeliveryPhoto: boolean;
  freeDeliveryOverCents: number | null;
  sameDayCutoff: string | null;
  contact: StoreContact;
  openingHours: OpeningHours | null;
}

export interface UpdateTenantInput {
  name?: string;
  taglineEs?: string | null;
  taglineEn?: string | null;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  settings?: {
    requireDeliveryPhoto?: boolean;
    freeDeliveryOverCents?: number | null;
    sameDayCutoff?: string | null;
    contact?: { phone?: string | null; email?: string | null; address?: string | null };
    openingHours?: OpeningHours | null;
  };
}

export const tenancyApi = createApi({
  reducerPath: 'tenancyApi',
  baseQuery,
  tagTypes: ['Tenant'],
  endpoints: (builder) => ({
    getCurrentTenant: builder.query<PublicTenant, void>({
      query: () => '/tenancy/current',
      providesTags: ['Tenant'],
    }),
    getAdminSettings: builder.query<TenantSettings, void>({
      query: () => '/tenancy/admin/settings',
      providesTags: ['Tenant'],
    }),
    updateTenant: builder.mutation<PublicTenant & { settings: TenantSettings }, UpdateTenantInput>({
      query: (body) => ({ url: '/tenancy/current', method: 'PATCH', body }),
      invalidatesTags: ['Tenant'],
    }),
  }),
});

export const { useGetCurrentTenantQuery, useGetAdminSettingsQuery, useUpdateTenantMutation } = tenancyApi;
