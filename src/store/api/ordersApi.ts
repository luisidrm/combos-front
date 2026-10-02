import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { cartApi } from './cartApi';
import type { CartView } from './cartApi';
import type { DeliveryZone } from './geoApi';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type CheckoutBlocker = 'EMPTY_CART' | 'CART_HAS_ISSUES' | 'NO_DELIVERY_ZONE';

export interface QuoteResult {
  cart: CartView;
  delivery: DeliveryZone | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: 'USD';
  canCheckout: boolean;
  blockers: CheckoutBlocker[];
}

// The address exactly as it was at checkout (province/municipality are ids; names come from /geo).
export interface AddressSnapshot {
  id: string;
  label: string | null;
  provinceId: string;
  municipalityId: string;
  street: string;
  betweenStreets: string | null;
  buildingApartment: string | null;
  neighborhood: string | null;
  referencePoints: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  recipientNameSnapshot: string;
  recipientPhonesSnapshot: string;
  addressSnapshot: AddressSnapshot;
  giftMessage: string | null;
  buyerNotes: string | null;
  currency: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  placedAt: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}
export interface OrderDetail extends Order {
  items: {
    productId: string | null;
    productNameEs: string;
    /** null on orders placed before the English name was recorded. */
    productNameEn: string | null;
    productThumbUrl: string | null;
    unitLabel: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
}

export interface BuyerSummary {
  fullName: string | null;
  email: string;
}
/** A row of the admin queue: the order plus who bought and how many items. */
export type ManualMethodName = 'zelle' | 'cashapp' | 'paypal';
export interface TransferReport {
  method: ManualMethodName;
  /** The confirmation number the buyer's app showed. */
  transferReference: string;
  notes: string | null;
  reportedAt: string;
}
export interface ManualMethod {
  method: ManualMethodName;
  label: string;
  /** What to type into the app as the recipient: an email or a $cashtag. */
  recipient: string;
  payeeName: string | null;
  /** Opens the app or site; null for Zelle (it lives inside the bank's own app). */
  link: string | null;
  /** True when the link already carries the amount. */
  amountInLink: boolean;
}
export interface PaymentInstructions {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  amountCents: number;
  currency: string;
  /** Goes in the transfer's note so the store can match the money to the order. */
  reference: string;
  methods: ManualMethod[];
  report: TransferReport | null;
}
export interface PaymentMethods {
  card: boolean;
  manual: Array<{ method: ManualMethodName; label: string }>;
}

export interface AdminOrderListItem extends Order {
  buyer: BuyerSummary | null;
  itemCount: number;
  /** A manual transfer the buyer says they sent, still waiting for someone to check it. */
  transferReported: boolean;
}
export interface AdminOrderDetail extends OrderDetail {
  buyer: BuyerSummary | null;
  paymentProvider: string | null;
  paymentReport: TransferReport | null;
}

export type StatsRange = 'week' | 'month' | 'year';
export interface PeriodTotals {
  orders: number;
  totalCents: number;
  averageTicketCents: number;
  /** 0..1 */
  freeDeliveryShare: number;
}
export interface SalesStats {
  range: StatsRange;
  currency: 'USD';
  granularity: 'day' | 'month';
  current: PeriodTotals;
  previous: PeriodTotals;
  series: Array<{ bucket: string; totalCents: number; orders: number }>;
  byMunicipality: Array<{ provinceId: string; municipalityId: string; orders: number }>;
  topProducts: Array<{ productId: string | null; nameEs: string; nameEn: string | null; quantity: number; totalCents: number }>;
}

export interface CheckoutInput {
  recipientId: string;
  addressId: string;
  provider: 'tropipay' | 'manual';
  giftMessage?: string;
  buyerNotes?: string;
}
export interface CheckoutResult {
  order: OrderDetail;
  checkoutUrl: string | null;
}

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery,
  tagTypes: ['Order', 'AdminOrder'],
  endpoints: (builder) => ({
    // The API prices a checkout with POST /orders/quote (read-only, despite the verb).
    getQuote: builder.query<QuoteResult, { recipientId: string; addressId: string }>({
      query: (body) => ({ url: '/orders/quote', method: 'POST', body }),
    }),
    // Checkout empties the buyer's cart server-side — cartApi is a separate
    // slice, so its 'Cart' tag is invalidated explicitly rather than
    // through a shared tagTypes list.
    checkout: builder.mutation<CheckoutResult, CheckoutInput>({
      query: (body) => ({ url: '/orders/checkout', method: 'POST', body }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(cartApi.util.invalidateTags(['Cart']));
      },
    }),
    getOrders: builder.query<Order[], void>({
      query: () => '/orders',
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getOrderById: builder.query<OrderDetail, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    retryPayment: builder.mutation<{ checkoutUrl: string | null }, string>({
      query: (id) => ({ url: `/orders/${id}/retry-payment`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    cancelOrder: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/${id}/cancel`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Order', id }, { type: 'Order', id: 'LIST' }],
    }),

    // --- admin -------------------------------------------------------------
    getAdminOrders: builder.query<AdminOrderListItem[], { status?: OrderStatus } | void>({
      query: (args) => ({ url: '/orders/admin/list', params: args ?? undefined }),
      providesTags: [{ type: 'AdminOrder', id: 'LIST' }],
    }),
    getAdminOrderById: builder.query<AdminOrderDetail, string>({
      query: (id) => `/orders/admin/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminOrder', id }],
    }),
    adminMarkPaid: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/mark-paid`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
    adminMarkPreparing: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/preparing`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
    adminMarkOutForDelivery: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/out-for-delivery`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
    adminMarkDelivered: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/delivered`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
    // Which ways of paying this store offers (card, and which transfer apps).
    getPaymentMethods: builder.query<PaymentMethods, void>({
      query: () => '/payments/methods',
    }),
    // How to pay a manual-transfer order; null for a card order.
    getPaymentInstructions: builder.query<PaymentInstructions | null, string>({
      query: (id) => `/orders/${id}/payment-instructions`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    reportTransfer: builder.mutation<PaymentInstructions, { id: string; method: ManualMethodName; transferReference: string; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/transfer-report`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Order', id }],
    }),
    getSalesStats: builder.query<SalesStats, StatsRange>({
      query: (range) => ({ url: '/orders/admin/stats', params: { range } }),
      providesTags: [{ type: 'AdminOrder', id: 'LIST' }],
    }),
    adminCancelOrder: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/cancel`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
    adminRefundOrder: builder.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/orders/admin/${id}/refund`, method: 'POST', body: note ? { note } : undefined }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminOrder', id }, { type: 'AdminOrder', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPaymentMethodsQuery,
  useGetPaymentInstructionsQuery,
  useReportTransferMutation,
  useGetQuoteQuery,
  useLazyGetQuoteQuery,
  useCheckoutMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useRetryPaymentMutation,
  useCancelOrderMutation,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  useAdminMarkPaidMutation,
  useAdminMarkPreparingMutation,
  useAdminMarkOutForDeliveryMutation,
  useAdminMarkDeliveredMutation,
  useGetSalesStatsQuery,
  useAdminCancelOrderMutation,
  useAdminRefundOrderMutation,
} = ordersApi;
