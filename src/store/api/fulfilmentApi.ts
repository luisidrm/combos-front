import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { ordersApi } from './ordersApi';
import type { AdminOrderListItem } from './ordersApi';

export interface DeliveryProof {
  orderId: string;
  recipientName: string | null;
  notes: string | null;
  deliveredAt: string;
  photos: Array<{ id: string; thumbUrl: string | null; cardUrl: string | null; fullUrl: string | null }>;
}

export interface DeliverInput {
  orderId: string;
  recipientName: string;
  notes?: string;
}

export const fulfilmentApi = createApi({
  reducerPath: 'fulfilmentApi',
  baseQuery,
  tagTypes: ['Queue', 'Proof'],
  endpoints: (builder) => ({
    /** Orders out for delivery: the courier's day. */
    getDeliveryQueue: builder.query<AdminOrderListItem[], void>({
      query: () => '/fulfilment/queue',
      providesTags: ['Queue'],
    }),
    /** The proof of delivery, or null when none was recorded. A buyer may read it for their own order. */
    getDeliveryProof: builder.query<DeliveryProof | null, string>({
      query: (orderId) => `/fulfilment/orders/${orderId}/proof`,
      providesTags: (_result, _error, orderId) => [{ type: 'Proof', id: orderId }],
    }),
    deliver: builder.mutation<DeliveryProof, DeliverInput>({
      query: ({ orderId, ...body }) => ({ url: `/fulfilment/orders/${orderId}/deliver`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { orderId }) => ['Queue', { type: 'Proof', id: orderId }],
      // The order itself moved to "delivered": the other slice's cache has to hear about it.
      async onQueryStarted({ orderId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            ordersApi.util.invalidateTags([
              { type: 'AdminOrder', id: orderId },
              { type: 'AdminOrder', id: 'LIST' },
              { type: 'Order', id: orderId },
            ]),
          );
        } catch {
          // The caller shows the error.
        }
      },
    }),
  }),
});

export const { useGetDeliveryQueueQuery, useGetDeliveryProofQuery, useDeliverMutation } = fulfilmentApi;
