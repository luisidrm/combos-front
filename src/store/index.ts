import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist';
// No PersistGate (see store/Provider.tsx) — persistStore's rehydration
// still runs, it just isn't gated behind a loading render.
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { identityApi } from './api/identityApi';
import { tenancyApi } from './api/tenancyApi';
import { authApi } from './api/authApi';
import { catalogApi } from './api/catalogApi';
import { mediaApi } from './api/mediaApi';
import { geoApi } from './api/geoApi';
import { cartApi } from './api/cartApi';
import { recipientsApi } from './api/recipientsApi';
import { ordersApi } from './api/ordersApi';
import { fulfilmentApi } from './api/fulfilmentApi';
import cartReducer from './slices/cartSlice';
import prefsReducer from './slices/prefsSlice';

// Next.js renders this module on the server too, where `window` (and
// therefore localStorage) doesn't exist — redux-persist needs a storage
// engine either way, so the server gets a no-op one.
const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: (_key: string, value: string) => Promise.resolve(value),
  removeItem: () => Promise.resolve(),
};

const storage = typeof window !== 'undefined' ? createWebStorage('local') : noopStorage;

// One createApi per domain (not one shared baseApi with injectEndpoints) —
// each has its own reducerPath, reducer and middleware, wired in explicitly
// below rather than through a shared registry.
const rootReducer = combineReducers({
  cart: cartReducer,
  prefs: prefsReducer,
  [identityApi.reducerPath]: identityApi.reducer,
  [tenancyApi.reducerPath]: tenancyApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [catalogApi.reducerPath]: catalogApi.reducer,
  [mediaApi.reducerPath]: mediaApi.reducer,
  [geoApi.reducerPath]: geoApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
  [recipientsApi.reducerPath]: recipientsApi.reducer,
  [ordersApi.reducerPath]: ordersApi.reducer,
  [fulfilmentApi.reducerPath]: fulfilmentApi.reducer,
});

// CLAUDE.md section 7: "Never persist the RTK Query cache" — stale prices
// and stock status rehydrating from last visit is the single most common
// failure with this stack. cart/prefs only; version + migrate from day one
// so a future shape change doesn't throw at boot on an old persisted blob.
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['cart', 'prefs'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      identityApi.middleware,
      tenancyApi.middleware,
      authApi.middleware,
      catalogApi.middleware,
      mediaApi.middleware,
      geoApi.middleware,
      cartApi.middleware,
      recipientsApi.middleware,
      ordersApi.middleware,
      fulfilmentApi.middleware,
    ),
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
