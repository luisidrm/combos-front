'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRequestPasswordResetMutation } from '@/store/api/authApi';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">{t('resetPasswordTitle')}</h1>
      {sent ? (
        <p className="mt-4 text-sm text-neutral-600">{t('resetLinkSent')}</p>
      ) : (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await requestReset({ email }).unwrap();
            setSent(true);
          }}
        >
          <input
            required
            type="email"
            placeholder={t('emailLabel') as string}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isLoading ? '…' : t('sendResetLink')}
          </button>
        </form>
      )}
    </div>
  );
}
