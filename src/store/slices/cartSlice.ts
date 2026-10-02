import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// The server cart is authoritative (CLAUDE.md section 7) — this slice only
// remembers the guest cart token between visits so a returning guest keeps
// their cart, and the buyer's chosen checkout selections for the current
// session. It never stores prices, quantities, or availability.
interface CartState {
  guestToken: string | null;
  selectedRecipientId: string | null;
  selectedAddressId: string | null;
}

const initialState: CartState = {
  guestToken: null,
  selectedRecipientId: null,
  selectedAddressId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setGuestToken: (state, action: PayloadAction<string | null>) => {
      state.guestToken = action.payload;
    },
    clearGuestToken: (state) => {
      state.guestToken = null;
    },
    setCheckoutSelection: (
      state,
      action: PayloadAction<{ recipientId: string | null; addressId: string | null }>,
    ) => {
      state.selectedRecipientId = action.payload.recipientId;
      state.selectedAddressId = action.payload.addressId;
    },
  },
});

export const { setGuestToken, clearGuestToken, setCheckoutSelection } = cartSlice.actions;
export default cartSlice.reducer;

export const selectGuestToken = (state: { cart: CartState }) => state.cart.guestToken;
export const selectCheckoutSelection = (state: { cart: CartState }) => ({
  recipientId: state.cart.selectedRecipientId,
  addressId: state.cart.selectedAddressId,
});
