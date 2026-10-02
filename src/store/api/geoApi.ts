import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

export interface Province {
  id: string;
  nameEs: string;
  nameEn: string;
}
export interface Municipality {
  id: string;
  nameEs: string;
  nameEn: string;
}

export interface DeliveryZone {
  id: string;
  municipalityId: string;
  feeCents: number;
  active: boolean;
  municipality: { nameEs: string; nameEn: string };
  province: { id: string; nameEs: string; nameEn: string };
}

export interface CreateDeliveryZoneInput {
  municipalityId: string;
  feeCents: number;
  active?: boolean;
}

export const geoApi = createApi({
  reducerPath: 'geoApi',
  baseQuery,
  tagTypes: ['DeliveryZone', 'AdminDeliveryZone'],
  endpoints: (builder) => ({
    getProvinces: builder.query<Province[], void>({
      query: () => '/geo/provinces',
    }),
    getMunicipalities: builder.query<Municipality[], string>({
      query: (provinceId) => `/geo/provinces/${provinceId}/municipalities`,
    }),
    getDeliveryZones: builder.query<DeliveryZone[], void>({
      query: () => '/geo/delivery-zones',
      providesTags: ['DeliveryZone'],
    }),
    getAdminDeliveryZones: builder.query<DeliveryZone[], void>({
      query: () => '/geo/admin/delivery-zones',
      providesTags: ['AdminDeliveryZone'],
    }),
    createDeliveryZone: builder.mutation<DeliveryZone, CreateDeliveryZoneInput>({
      query: (body) => ({ url: '/geo/delivery-zones', method: 'POST', body }),
      invalidatesTags: ['DeliveryZone', 'AdminDeliveryZone'],
    }),
    updateDeliveryZone: builder.mutation<DeliveryZone, { id: string; feeCents?: number; active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/geo/delivery-zones/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['DeliveryZone', 'AdminDeliveryZone'],
    }),
  }),
});

export const {
  useGetProvincesQuery,
  useGetMunicipalitiesQuery,
  useGetDeliveryZonesQuery,
  useGetAdminDeliveryZonesQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
} = geoApi;
