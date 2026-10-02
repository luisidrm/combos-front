import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { identityApi } from './identityApi';
import { cartApi } from './cartApi';

interface FormField {
  id: string;
  value: string;
}
export interface FieldError {
  id: string;
  error: string;
}

// Everyone — buyers and staff — signs in with email + password (docs/API.md
// section 1). Buyers create their own account; staff accounts come from the seed.

export type SignInResponse =
  | { status: 'OK'; user: { id: string; email: string } }
  | { status: 'WRONG_CREDENTIALS_ERROR' };

export type SignUpResponse =
  | { status: 'OK'; user: { id: string; emails: string[] } }
  | { status: 'FIELD_ERROR'; formFields: FieldError[] };

export type VerifyEmailResponse = { status: 'OK' } | { status: 'EMAIL_VERIFICATION_INVALID_TOKEN_ERROR' };
export type ResendVerificationResponse = { status: 'OK' } | { status: 'EMAIL_ALREADY_VERIFIED_ERROR' };

export type RequestPasswordResetResponse = { status: 'OK' } | { status: 'FIELD_ERROR'; formFields: FieldError[] };

export type SubmitPasswordResetResponse =
  | { status: 'OK' }
  | { status: 'RESET_PASSWORD_INVALID_TOKEN_ERROR' }
  | { status: 'FIELD_ERROR'; formFields: FieldError[] };

// authApi is a separate RTK Query slice from identityApi/cartApi (each its
// own createApi/reducerPath, per the pattern this was switched to match) —
// tags only invalidate within their own slice, so a login/logout here has
// to explicitly poke the other slices' caches rather than relying on a
// shared tagTypes list the way one baseApi would have.
function invalidateSession(dispatch: (action: unknown) => void) {
  dispatch(identityApi.util.invalidateTags(['Me']));
  dispatch(cartApi.util.invalidateTags(['Cart']));
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  endpoints: (builder) => ({
    signIn: builder.mutation<SignInResponse, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: '/auth/signin',
        method: 'POST',
        headers: { rid: 'emailpassword' },
        body: {
          formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
          ] satisfies FormField[],
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateSession(dispatch);
      },
    }),

    // Creates the buyer account AND signs them in (the API starts a session);
    // a verification email is sent right away.
    signUp: builder.mutation<SignUpResponse, { name: string; email: string; phone: string; password: string }>({
      query: ({ name, email, phone, password }) => ({
        url: '/auth/signup',
        method: 'POST',
        headers: { rid: 'emailpassword' },
        body: {
          formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
            { id: 'name', value: name },
            { id: 'phone', value: phone },
          ] satisfies FormField[],
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data.status === 'OK') invalidateSession(dispatch);
      },
    }),

    // The token comes from the emailed link; no session is needed to use it.
    verifyEmail: builder.mutation<VerifyEmailResponse, { token: string }>({
      query: ({ token }) => ({
        url: '/auth/user/email/verify',
        method: 'POST',
        headers: { rid: 'emailverification' },
        body: { method: 'token', token, tenantId: 'public' },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(identityApi.util.invalidateTags(['Me']));
      },
    }),

    // "Send me another link" — needs the session created at signup / login.
    resendVerificationEmail: builder.mutation<ResendVerificationResponse, void>({
      query: () => ({ url: '/auth/user/email/verify/token', method: 'POST', headers: { rid: 'emailverification' } }),
    }),

    requestPasswordReset: builder.mutation<RequestPasswordResetResponse, { email: string }>({
      query: ({ email }) => ({
        url: '/auth/user/password/reset/token',
        method: 'POST',
        headers: { rid: 'emailpassword' },
        body: { formFields: [{ id: 'email', value: email }] satisfies FormField[] },
      }),
    }),

    submitPasswordReset: builder.mutation<SubmitPasswordResetResponse, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: '/auth/user/password/reset',
        method: 'POST',
        headers: { rid: 'emailpassword' },
        body: { token, formFields: [{ id: 'password', value: password }] satisfies FormField[] },
      }),
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({ url: '/auth/signout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        invalidateSession(dispatch);
      },
    }),
  }),
});

export const {
  useSignInMutation,
  useSignUpMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useRequestPasswordResetMutation,
  useSubmitPasswordResetMutation,
  useSignOutMutation,
} = authApi;
