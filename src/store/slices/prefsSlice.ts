import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// CLAUDE.md section 7: "prefs holds locale and display currency only."
// Locale here is a UI convenience the app pre-selects on the next visit —
// the URL segment (next-intl) is still the source of truth for the current
// render; this just seeds the redirect on the next cold visit.
interface PrefsState {
  locale: 'es' | 'en';
  currency: 'USD';
}

const initialState: PrefsState = {
  locale: 'es',
  currency: 'USD',
};

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<'es' | 'en'>) => {
      state.locale = action.payload;
    },
  },
});

export const { setLocale } = prefsSlice.actions;
export default prefsSlice.reducer;

export const selectLocale = (state: { prefs: PrefsState }) => state.prefs.locale;
