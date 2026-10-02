'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CircleAlert, CircleCheck, Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useResendVerificationEmailMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { useGetMeQuery } from '@/store/api/identityApi';

type Outcome = 'checking' | 'done' | 'invalid';

// Two ways in: the link in the email (?token=…) confirms the address right here;
// without a token this is the "check your inbox" screen shown after sign-up.
export default function VerifyEmailPage() {
  const t = useTranslations('auth.verify');
  const token = useSearchParams().get('token');
  const { data: me, isError: signedOut } = useGetMeQuery();
  const [verify] = useVerifyEmailMutation();
  const [resend, { isLoading: resending, isSuccess: resent }] = useResendVerificationEmailMutation();
  const [outcome, setOutcome] = useState<Outcome>('checking');
  // A token is single-use: React strict mode would otherwise fire the effect twice
  // in development and burn it on the first call.
  const tried = useRef(false);

  useEffect(() => {
    if (!token || tried.current) return;
    tried.current = true;
    verify({ token })
      .unwrap()
      .then((r) => setOutcome(r.status === 'OK' ? 'done' : 'invalid'))
      .catch(() => setOutcome('invalid'));
  }, [token, verify]);

  const shopLink = (
    <Link href="/shop" className="fc-btn fc-btn--primary fc-btn--lg">
      {t('continue')}
    </Link>
  );

  let body;
  if (token) {
    body =
      outcome === 'checking' ? (
        <p className="fc-notice__text">{t('checking')}</p>
      ) : outcome === 'done' ? (
        <>
          <CircleCheck size={40} className="fc-notice__icon" aria-hidden />
          <h1 className="fc-notice__title">{t('done')}</h1>
          <p className="fc-notice__text">{t('doneSub')}</p>
          {shopLink}
        </>
      ) : (
        <>
          <CircleAlert size={40} className="fc-notice__icon fc-notice__icon--bad" aria-hidden />
          <p className="fc-notice__text">{t('invalid')}</p>
          <Link href="/account/verify-email" className="fc-btn fc-btn--secondary fc-btn--lg">
            {t('resend')}
          </Link>
        </>
      );
  } else if (signedOut) {
    body = (
      <>
        <p className="fc-notice__text">{t('signInFirst')}</p>
        <Link href="/account/sign-in" className="fc-btn fc-btn--primary fc-btn--lg">
          {t('continue')}
        </Link>
      </>
    );
  } else if (me?.emailVerified) {
    body = (
      <>
        <CircleCheck size={40} className="fc-notice__icon" aria-hidden />
        <p className="fc-notice__text">{t('alreadyVerified')}</p>
        {shopLink}
      </>
    );
  } else {
    body = (
      <>
        <Mail size={40} className="fc-notice__icon" aria-hidden />
        <h1 className="fc-notice__title">{t('title')}</h1>
        <p className="fc-notice__text">{t('sentTo', { email: me?.email ?? '' })}</p>
        <Button variant="secondary" size="lg" loading={resending} disabled={resent} onClick={() => resend()}>
          {resent ? t('resent') : t('resend')}
        </Button>
        <Link href="/shop" className="fc-btn fc-btn--plain">
          {t('continue')}
        </Link>
      </>
    );
  }

  return (
    <div className="fc-notice">
      <Card className="fc-notice__card">{body}</Card>
    </div>
  );
}
