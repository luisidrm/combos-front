import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

export interface Address {
  id: string;
  label: string | null;
  isDefault: boolean;
  provinceId: string;
  municipalityId: string;
  street: string;
  betweenStreets: string | null;
  buildingApartment: string | null;
  neighborhood: string | null;
  referencePoints: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Recipient {
  id: string;
  fullName: string;
  phone1: string;
  phone2: string | null;
  addresses: Address[];
}

export interface CreateAddressInput {
  label?: string;
  provinceId: string;
  municipalityId: string;
  street: string;
  betweenStreets?: string;
  buildingApartment?: string;
  neighborhood?: string;
  referencePoints?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}
// Optional text fields may be sent as null to clear them.
export interface UpdateAddressInput {
  label?: string | null;
  provinceId?: string;
  municipalityId?: string;
  street?: string;
  betweenStreets?: string | null;
  buildingApartment?: string | null;
  neighborhood?: string | null;
  referencePoints?: string | null;
  lat?: number;
  lng?: number;
}

export interface CreateRecipientInput {
  fullName: string;
  phone1: string;
  phone2?: string;
  address?: CreateAddressInput;
}
export interface UpdateRecipientInput {
  fullName?: string;
  phone1?: string;
  phone2?: string | null;
}

export const recipientsApi = createApi({
  reducerPath: 'recipientsApi',
  baseQuery,
  tagTypes: ['Recipient'],
  endpoints: (builder) => ({
    getRecipients: builder.query<Recipient[], void>({
      query: () => '/recipients',
      providesTags: (result) =>
        result
          ? [...result.map((r) => ({ type: 'Recipient' as const, id: r.id })), { type: 'Recipient', id: 'LIST' }]
          : [{ type: 'Recipient', id: 'LIST' }],
    }),
    getRecipientById: builder.query<Recipient, string>({
      query: (id) => `/recipients/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Recipient', id }],
    }),
    createRecipient: builder.mutation<Recipient, CreateRecipientInput>({
      query: (body) => ({ url: '/recipients', method: 'POST', body }),
      invalidatesTags: [{ type: 'Recipient', id: 'LIST' }],
    }),
    updateRecipient: builder.mutation<Recipient, { id: string } & UpdateRecipientInput>({
      query: ({ id, ...body }) => ({ url: `/recipients/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Recipient', id }, { type: 'Recipient', id: 'LIST' }],
    }),
    deleteRecipient: builder.mutation<void, string>({
      query: (id) => ({ url: `/recipients/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Recipient', id: 'LIST' }],
    }),
    addAddress: builder.mutation<Recipient, { recipientId: string } & CreateAddressInput>({
      query: ({ recipientId, ...body }) => ({ url: `/recipients/${recipientId}/addresses`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { recipientId }) => [{ type: 'Recipient', id: recipientId }],
    }),
    updateAddress: builder.mutation<Recipient, { recipientId: string; addressId: string } & UpdateAddressInput>({
      query: ({ recipientId, addressId, ...body }) => ({
        url: `/recipients/${recipientId}/addresses/${addressId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { recipientId }) => [{ type: 'Recipient', id: recipientId }],
    }),
    setDefaultAddress: builder.mutation<Recipient, { recipientId: string; addressId: string }>({
      query: ({ recipientId, addressId }) => ({
        url: `/recipients/${recipientId}/addresses/${addressId}/default`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { recipientId }) => [{ type: 'Recipient', id: recipientId }],
    }),
    deleteAddress: builder.mutation<Recipient, { recipientId: string; addressId: string }>({
      query: ({ recipientId, addressId }) => ({
        url: `/recipients/${recipientId}/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { recipientId }) => [{ type: 'Recipient', id: recipientId }],
    }),
  }),
});

export const {
  useGetRecipientsQuery,
  useGetRecipientByIdQuery,
  useCreateRecipientMutation,
  useUpdateRecipientMutation,
  useDeleteRecipientMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} = recipientsApi;
