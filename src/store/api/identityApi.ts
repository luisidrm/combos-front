import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

export interface Me {
  id: string;
  email: string;
  role: 'buyer' | 'admin' | 'staff' | 'courier';
  fullName: string | null;
  phone: string | null;
  /** Buyers must confirm their email before placing an order (see /auth/user/email/verify). */
  emailVerified: boolean;
}

export const identityApi = createApi({
  reducerPath: 'identityApi',
  baseQuery,
  tagTypes: ['Me'],
  endpoints: (builder) => ({
    // Re-read fresh on every call by design (CLAUDE.md section 7) — the
    // token proves who someone *was*, this is who they are right now.
    getMe: builder.query<Me, void>({
      query: () => '/identity/me',
      providesTags: ['Me'],
    }),
  }),
});

export const { useGetMeQuery, useLazyGetMeQuery } = identityApi;
