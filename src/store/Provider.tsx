'use client';

import { Provider } from 'react-redux';
import { store } from './index';
import '@/lib/supertokens';

// Deliberately no PersistGate: gating children until rehydration finishes
// would blank the server-rendered HTML for every page, including the RSC
// storefront (CLAUDE.md section 7) that this Provider also wraps — Server
// Components render fine as children of a client Provider, so the
// storefront still renders on the server exactly as before. Redux simply
// starts with default state (there is no browser storage during SSR
// anyway) and rehydrates asynchronously right after mount; anything
// reading persisted state (the guest cart token, locale prefs) just
// re-renders once that finishes, same as any other async client update.
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
