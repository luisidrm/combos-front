import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { setGuestToken } from '@/store/slices/cartSlice';

export type CartIssue = 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'EXCEEDS_MAX_PER_ORDER' | null;

export interface CartItem {
  productId: string;
  quantity: number;
  lineTotalCents: number;
  issue: CartIssue;
  product: {
    slug: string;
    nameEs: string;
    nameEn: string;
    unitLabel: string;
    unitPriceCents: number;
    stockStatus: 'available' | 'limited' | 'out';
    maxPerOrder: number | null;
    picture: { thumbUrl: string; cardUrl: string } | null;
  } | null;
}

export interface CartView {
  guestToken?: string;
  items: CartItem[];
  itemCount: number;
  currency: 'USD';
  subtotalCents: number;
  checkoutReady: boolean;
}

// Every mutation may hand back a freshly-minted guestToken (a new guest, or
// the current one having expired) — docs/API.md section 7 says the server
// never accepts a client-chosen token, so every response is the one source
// of truth and gets mirrored into Redux right here rather than leaving
// every call site responsible for remembering to do it.
function rememberGuestToken(dispatch: (action: unknown) => void, data: CartView) {
  if (data.guestToken) {
    dispatch(setGuestToken(data.guestToken));
  }
}

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery,
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    getCart: builder.query<CartView, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        rememberGuestToken(dispatch, data);
      },
    }),
    addCartItem: builder.mutation<CartView, { productId: string; quantity?: number }>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        rememberGuestToken(dispatch, data);
      },
    }),
    updateCartItem: builder.mutation<CartView, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({ url: `/cart/items/${productId}`, method: 'PATCH', body: { quantity } }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<CartView, string>({
      query: (productId) => ({ url: `/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<CartView, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    mergeCart: builder.mutation<CartView, { items: { productId: string; quantity: number }[] }>({
      query: (body) => ({ url: '/cart/merge', method: 'POST', body }),
      invalidatesTags: ['Cart'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        rememberGuestToken(dispatch, data);
      },
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
} = cartApi;
