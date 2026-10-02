// Delivery pricing the storefront shows BEFORE checkout. The numbers are the
// store's own: the per-municipality fee comes from GET /geo/delivery-zones and
// the "free delivery from $X" offer from GET /tenancy/current. The server
// (POST /orders/quote) applies the same rule when it prices the order.

/** Delivery fee for a subtotal: waived at the free-delivery threshold, otherwise the zone's flat fee (null = no zone known). */
export function deliveryFee(subtotalCents: number, zoneFeeCents: number | null, freeOverCents: number | null): number | null {
  if (subtotalCents === 0) return 0;
  if (freeOverCents !== null && subtotalCents >= freeOverCents) return 0;
  return zoneFeeCents;
}
