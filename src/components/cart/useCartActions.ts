'use client';

import { useCallback, useMemo } from 'react';
import {
  useAddCartItemMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/store/api/cartApi';

/**
 * The server cart is authoritative (CLAUDE.md section 7): quantities shown here
 * come from GET /cart, and every change goes through the API, which reprices.
 * `busy` covers the round-trip so a double tap can't fire two stale updates.
 */
export function useCartActions() {
  const { data: cart } = useGetCartQuery();
  const [addItem, add] = useAddCartItemMutation();
  const [updateItem, update] = useUpdateCartItemMutation();
  const [removeItem, remove] = useRemoveCartItemMutation();

  const quantities = useMemo(() => new Map((cart?.items ?? []).map((i) => [i.productId, i.quantity])), [cart]);

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const current = quantities.get(productId) ?? 0;
      try {
        if (quantity <= 0) await removeItem(productId).unwrap();
        else if (current === 0) await addItem({ productId, quantity }).unwrap();
        else await updateItem({ productId, quantity }).unwrap();
      } catch {
        // The API rejected it (out of stock, over the per-order limit…). The cart
        // query is left as-is, so the control simply snaps back to the server's truth.
      }
    },
    [quantities, addItem, updateItem, removeItem],
  );

  return {
    cart,
    quantityOf: (productId: string) => quantities.get(productId) ?? 0,
    setQuantity,
    busy: add.isLoading || update.isLoading || remove.isLoading,
  };
}
