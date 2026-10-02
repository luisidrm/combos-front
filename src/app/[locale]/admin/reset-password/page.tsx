'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSubmitPasswordResetMutation } from '@/store/api/authApi';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitReset, { isLoading }] = useSubmitPasswordResetMutation();

  if (success) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <p className="text-sm text-emerald-700">{t('resetSuccess')}</p>
        <button onClick={() => router.push('/account/sign-in')} className="mt-4 text-sm font-medium text-primary underline">
          {t('signInTitle')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">{t('resetPasswordTitle')}</h1>
      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const result = await submitReset({ token, password }).unwrap();
          if (result.status === 'OK') {
            setSuccess(true);
          } else if (result.status === 'FIELD_ERROR') {
            setError(result.formFields[0]?.error ?? 'Error');
          } else {
            setError(result.status);
          }
        }}
      >
        <input
          required
          type="password"
          placeholder={t('newPassword') as string}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? '…' : t('newPassword')}
        </button>
      </form>
    </div>
  );
}
