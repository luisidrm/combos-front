'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock, Mail, Phone, Truck, User } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { useSignInMutation, useSignUpMutation } from '@/store/api/authApi';
import type { FieldError } from '@/store/api/authApi';
import { useLazyGetMeQuery } from '@/store/api/identityApi';

type Mode = 'login' | 'signup';

function isRateLimited(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'status' in err && err.status === 429;
}

/** Login / sign-up (design: auth.jsx). Email + password; buyers confirm their email after signing up. */
export function AuthScreen({ place, freeOver }: { place: string; freeOver: string | null }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  // Where to go after logging in (e.g. the cart sends people on to checkout). Same-site paths only.
  const params = useSearchParams();
  const next = params.get('next');
  const afterLogin = next && next.startsWith('/') && !next.startsWith('//') ? next : '/shop';
  const [signIn, { isLoading: signingIn }] = useSignInMutation();
  const [signUp, { isLoading: signingUp }] = useSignUpMutation();
  const [getMe] = useLazyGetMeQuery();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const up = mode === 'signup';
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  // The API reports which field failed; the wording is ours (and translated).
  function describe({ id, error }: FieldError): string {
    switch (id) {
      case 'email':
        return /already exists/i.test(error) ? t('emailTaken') : t('emailInvalid');
      case 'name':
        return t('nameRequired');
      case 'phone':
        return t('phoneInvalid');
      default:
        return t('passwordPolicy');
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    try {
      if (!up) {
        const result = await signIn({ email: form.email, password: form.password }).unwrap();
        if (result.status !== 'OK') {
          setFormError(t('wrongCredentials'));
          return;
        }
        // Staff use this same form: send each role to its own area.
        const me = await getMe().unwrap();
        router.push(me.role === 'admin' ? '/admin' : me.role === 'courier' ? '/courier' : afterLogin);
        return;
      }
      const result = await signUp(form).unwrap();
      if (result.status === 'FIELD_ERROR') {
        setFieldErrors(Object.fromEntries(result.formFields.map((f) => [f.id, describe(f)])));
        return;
      }
      router.push('/account/verify-email');
    } catch (err) {
      setFormError(isRateLimited(err) ? t('rateLimited') : tc('error'));
    }
  }

  return (
    <div className="fc-auth">
      <div className="fc-auth__hero">
        <div className="fc-photo" style={{ position: 'absolute', inset: 0, alignItems: 'flex-start', padding: 24 }}>
          {t('panelPhoto')}
        </div>
        <Card variant="glass" padding={22} className="fc-auth__hero-card">
          <div className="fc-wordmark" style={{ fontSize: 20 }}>food-combos</div>
          <div className="fc-auth__hero-title">{t('panelTitle', { place })}</div>
          {freeOver && (
            <div className="fc-auth__hero-perk">
              <Truck size={16} aria-hidden />
              {t('panelPerk', { amount: freeOver })}
            </div>
          )}
        </Card>
      </div>

      <div className="fc-auth__form-wrap">
        <form onSubmit={submit} className="fc-auth__form">
          <Link href="/" className="fc-wordmark fc-auth__brand">
            food-combos
          </Link>
          <div>
            <h1 className="fc-auth__title">{up ? t('signupTitle') : t('loginTitle')}</h1>
            <p className="fc-auth__sub">{up ? t('signupSub') : t('loginSub')}</p>
          </div>
          <SegmentedControl<Mode>
            size="md"
            block
            label={t('tabs.login') + ' / ' + t('tabs.signup')}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setFieldErrors({});
              setFormError(null);
            }}
            options={[
              { value: 'login', label: t('tabs.login') },
              { value: 'signup', label: t('tabs.signup') },
            ]}
          />

          {up && (
            <TextField
              label={t('fullName')}
              icon={User}
              required
              autoComplete="name"
              placeholder="Ana Pérez"
              value={form.name}
              onChange={set('name')}
              error={fieldErrors.name}
            />
          )}
          <TextField
            label={t('emailLabel')}
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            placeholder="ana@correo.com"
            value={form.email}
            onChange={set('email')}
            error={fieldErrors.email}
          />
          {up && (
            <TextField
              label={t('phone')}
              icon={Phone}
              type="tel"
              autoComplete="tel"
              placeholder="+1 (305) 555-0142"
              value={form.phone}
              onChange={set('phone')}
              error={fieldErrors.phone}
            />
          )}
          <TextField
            label={t('passwordLabel')}
            icon={Lock}
            type="password"
            required
            autoComplete={up ? 'new-password' : 'current-password'}
            placeholder="••••••••••"
            value={form.password}
            onChange={set('password')}
            hint={up && !fieldErrors.password ? t('passwordHint') : undefined}
            error={fieldErrors.password}
          />
          {!up && (
            <Link href="/admin/forgot-password" className="fc-auth__forgot">
              {t('forgotPassword')}
            </Link>
          )}

          {formError && (
            <div className="fc-auth__error" role="alert">
              {formError}
            </div>
          )}
          <Button type="submit" size="lg" block loading={signingIn || signingUp} style={{ marginTop: 6 }}>
            {up ? t('submitSignup') : t('submitLogin')}
          </Button>
          <p className="fc-auth__terms">{t('terms')}</p>
          <div className="fc-auth__shop">
            {t('shopOwner')} <Link href="/admin/sign-in">{t('goDashboard')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
