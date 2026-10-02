import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import Session from 'supertokens-web-js/recipe/session';
import { getTenantSlug } from '@/lib/tenant';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  // Sessions are httpOnly cookies set by the API (CLAUDE.md section 7) —
  // never a token this app can read. supertokens-web-js patches
  // window.fetch for requests to apiDomain and attaches the anti-csrf /
  // fdi-version headers itself; there is nothing to add here for auth.
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // Almost every route needs this (docs/API.md "Conventions"). Multi-tenant
    // subdomain routing is M7 — for now the storefront is built for one
    // configured tenant, read from the env.
    const slug = getTenantSlug();
    if (slug) {
      headers.set('x-tenant-slug', slug);
    }
    // Guest cart identity (docs/API.md section 7). Read from Redux, not
    // per-endpoint, so every cart/checkout call carries it automatically —
    // a signed-in buyer simply has no token here and the cookie session
    // takes over server-side.
    const state = getState() as { cart?: { guestToken?: string | null } };
    const guestToken = state.cart?.guestToken;
    if (guestToken) {
      headers.set('x-cart-token', guestToken);
    }
    return headers;
  },
});

// Five parallel 401s must not fire five refreshes — the first one to see a
// 401 owns the refresh; everyone else awaits the same in-flight promise
// (CLAUDE.md section 7's baseQueryWithReauth, translated into a mutex here
// since RTK Query gives no such lock for free).
let refreshPromise: Promise<boolean> | null = null;

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = Session.attemptRefreshingSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
    // A failed refresh means the session is truly gone. Components read
    // identityApi's getMe (which will keep failing) to notice this and
    // redirect — this layer only owns retrying, not navigation.
  }

  return result;
};
