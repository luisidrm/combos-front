'use client';

import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeftRight, Check, CreditCard, Lock, MailWarning, Plus, ShoppingBag, Store, Truck, User } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { FreeShipProgress, Totals } from '@/components/cart/CartSummary';
import { useCartActions } from '@/components/cart/useCartActions';
import { BLANK_RECIPIENT, RecipientFields, resolveRecipientForm, validateRecipient } from '@/components/checkout/RecipientFields';
import type { RecipientErrors, RecipientForm } from '@/components/checkout/RecipientFields';
import { PageHead } from '@/components/layout/PageHead';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Photo } from '@/components/ui/Photo';
import { TextField } from '@/components/ui/TextField';
import { deliveryFee } from '@/lib/delivery';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import { useDeliveryTerms } from '@/lib/useDeliveryTerms';
import { useGetMeQuery } from '@/store/api/identityApi';
import { useCheckoutMutation, useGetPaymentMethodsQuery, useGetQuoteQuery } from '@/store/api/ordersApi';
import { useCreateRecipientMutation, useGetRecipientsQuery } from '@/store/api/recipientsApi';

const NEW = 'new';

function apiReason(err: unknown): string | null {
  const data = (err as { data?: { error?: { details?: { reason?: string } } } } | null)?.data;
  return data?.error?.details?.reason ?? null;
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="fc-section">
      <div className="fc-section__head">
        <span className="fc-section__n">{n}</span>
        <div className="fc-section__title">{title}</div>
      </div>
      {children}
    </Card>
  );
}

/** Delivery + payment (design: Checkout). Card payment happens on the payment provider's hosted page (TropiPay today; the provider is chosen on the server), so there are no card fields here. */
export function CheckoutScreen() {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const ts = useTranslations('shop');
  const locale = useLocale();
  const router = useRouter();

  const { data: me, isLoading: meLoading, isError: signedOut } = useGetMeQuery();
  const isBuyer = me?.role === 'buyer';
  const { cart } = useCartActions();
  const { zones, freeOverCents } = useDeliveryTerms();
  const { data: recipients = [], isLoading: recipientsLoading } = useGetRecipientsQuery(undefined, { skip: !isBuyer });
  const [createRecipient] = useCreateRecipientMutation();
  const [checkout] = useCheckoutMutation();
  // Card (the provider's hosted page) or a transfer from Zelle / Cash App / PayPal. The transfer choice
  // exists only when the store has set up an account to receive it.
  const { data: methods } = useGetPaymentMethodsQuery();
  const transferAvailable = (methods?.manual.length ?? 0) > 0;
  const [payment, setPayment] = useState<'card' | 'transfer'>('card');
  const paying = payment === 'transfer' && transferAvailable ? 'transfer' : 'card';

  const [picked, setPicked] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipientForm>(BLANK_RECIPIENT);
  const [errors, setErrors] = useState<RecipientErrors>({});
  const [giftMessage, setGiftMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Guests (and staff) log in first and come straight back here.
  useEffect(() => {
    if (meLoading) return;
    if (signedOut || (me && me.role !== 'buyer')) router.replace({ pathname: '/account/sign-in', query: { next: '/checkout' } });
  }, [meLoading, signedOut, me, router]);

  // Until the buyer chooses, the first saved recipient (or the form) is selected.
  const selectedId = picked ?? recipients[0]?.id ?? NEW;
  const isNew = selectedId === NEW;
  const recipient = recipients.find((r) => r.id === selectedId);
  const address = recipient?.addresses.find((a) => a.id === addressId) ?? recipient?.addresses[0];

  const { data: quote } = useGetQuoteQuery(recipient && address ? { recipientId: recipient.id, addressId: address.id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const items = cart?.items ?? [];
  const subtotalCents = cart?.subtotalCents ?? 0;
  const places = useMemo(() => [...new Set(zones.map((z) => localized(locale, z.municipality.nameEs, z.municipality.nameEn)))], [zones, locale]);

  // Totals: the server's quote once it knows the address; until then (a recipient still being typed) the same rule locally.
  const resolved = resolveRecipientForm(form, zones);
  const zoneForForm = zones.find((z) => z.municipalityId === resolved.municipalityId);
  const feeCents = quote ? quote.deliveryFeeCents : deliveryFee(subtotalCents, zoneForForm?.feeCents ?? null, freeOverCents);
  const totalCents = quote ? quote.totalCents : subtotalCents + (feeCents ?? 0);
  const blockers = quote?.blockers ?? [];
  const unverified = me !== undefined && !me.emailVerified;

  function patch(p: Partial<RecipientForm>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function pay() {
    setFormError(null);
    if (isNew) {
      const found = validateRecipient(resolved, t);
      setErrors(found);
      if (Object.keys(found).length) {
        // The missing fields are up in step 1, well out of sight of the button that was just pressed:
        // say so next to the button and bring the first one into view.
        setFormError(t('errFix'));
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>('.fc-field--error');
          first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          first?.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
        });
        return;
      }
    }
    setBusy(true);
    try {
      let recipientId = recipient?.id;
      let chosenAddressId = address?.id;
      if (isNew) {
        const created = await createRecipient({
          fullName: form.name.trim(),
          phone1: form.phone.trim(),
          phone2: form.phone2.trim() || undefined,
          address: {
            provinceId: resolved.provinceId || zoneForForm?.province.id || '',
            municipalityId: resolved.municipalityId,
            street: form.street.trim(),
            betweenStreets: form.between.trim() || undefined,
            buildingApartment: form.building.trim() || undefined,
            neighborhood: form.neighborhood.trim() || undefined,
            referencePoints: form.reference.trim() || undefined,
          },
        }).unwrap();
        recipientId = created.id;
        chosenAddressId = created.addresses[0]?.id;
        // From here on it is a saved recipient, so a retry after a failure reuses it.
        setPicked(created.id);
        setAddressId(chosenAddressId ?? null);
      }
      if (!recipientId || !chosenAddressId) throw new Error('no recipient');

      const result = await checkout({
        recipientId,
        addressId: chosenAddressId,
        provider: paying === 'transfer' ? 'manual' : 'tropipay',
        giftMessage: giftMessage.trim() || undefined,
      }).unwrap();
      // Card payment happens on the provider's page. If it could not be opened the order still exists
      // (pending payment) and its page offers "Pagar ahora". A transfer has no page to open: the order
      // page shows how to pay.
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else router.push(`/account/orders/${result.order.id}`);
    } catch (err) {
      const reason = apiReason(err);
      setFormError(reason === 'EMAIL_NOT_VERIFIED' ? t('verifyTitle') : tc('error'));
      setBusy(false);
    }
  }

  if (meLoading || !isBuyer || recipientsLoading) {
    return (
      <div className="fc-page">
        <PageHead title={t('title')} back={{ href: '/cart', label: t('back') }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fc-page">
        <PageHead title={t('title')} back={{ href: '/shop', label: ts('title') }} />
        <Card className="fc-emptycard">
          <ShoppingBag size={32} aria-hidden />
          <div className="fc-emptycard__title">{ts('panel.empty')}</div>
          <Link href="/shop" className="fc-btn fc-btn--primary" style={{ marginTop: 8 }}>
            <Store size={18} aria-hidden />
            {ts('panel.review')}
          </Link>
        </Card>
      </div>
    );
  }

  const canPay = !busy && !unverified && (isNew || (quote?.canCheckout ?? false));
  const payButton = (
    <Button size="lg" block icon={Lock} loading={busy} disabled={!canPay} onClick={pay}>
      {paying === 'transfer' ? t('placeOrder', { amount: formatUsd(totalCents) }) : t('pay', { amount: formatUsd(totalCents) })}
    </Button>
  );

  return (
    <div className="fc-page">
      <PageHead title={t('title')} back={{ href: '/cart', label: t('back') }} />

      {unverified && me && (
        <Card variant="grouped" className="fc-verify">
          <MailWarning size={22} aria-hidden />
          <div className="fc-verify__text">
            <strong>{t('verifyTitle')}</strong>
            <span>{t('verifyText', { email: me.email })}</span>
          </div>
          <Link href="/account/verify-email" className="fc-btn fc-btn--secondary fc-btn--sm">
            {t('verifyGo')}
          </Link>
        </Card>
      )}

      <div className="fc-cart">
        <div className="fc-cart__lines">
          <Section n={1} title={t('s1')}>
            <div className="fc-picks">
              {recipients.map((r) => {
                const on = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="fc-pick"
                    aria-pressed={on}
                    onClick={() => {
                      setPicked(r.id);
                      setAddressId(null);
                      setErrors({});
                    }}
                  >
                    <span className="fc-pick__icon">{on ? <Check size={16} aria-hidden /> : <User size={16} aria-hidden />}</span>
                    <span className="fc-pick__text">
                      <span className="fc-pick__title">{r.fullName}</span>
                      <span className="fc-pick__sub">{r.addresses[0]?.street}</span>
                    </span>
                  </button>
                );
              })}
              <button type="button" className="fc-pick" aria-pressed={isNew} onClick={() => setPicked(NEW)}>
                <span className="fc-pick__icon">{isNew ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}</span>
                <span className="fc-pick__text">
                  <span className="fc-pick__title">{t('newRecipient')}</span>
                </span>
              </button>
            </div>

            {recipient && (
              <div className="fc-recap">
                <div>{recipient.fullName}</div>
                <div className="fc-recap__mono">{[recipient.phone1, recipient.phone2].filter(Boolean).join(' · ')}</div>
              </div>
            )}
          </Section>

          <Section n={2} title={t('s2')}>
            {isNew ? (
              <RecipientFields value={form} errors={errors} onChange={patch} zones={zones} />
            ) : (
              recipient && (
                <div className="fc-picks">
                  {recipient.addresses.map((a) => (
                    <button key={a.id} type="button" className="fc-pick" aria-pressed={address?.id === a.id} onClick={() => setAddressId(a.id)}>
                      <span className="fc-pick__icon">{address?.id === a.id ? <Check size={16} aria-hidden /> : <Truck size={16} aria-hidden />}</span>
                      <span className="fc-pick__text">
                        <span className="fc-pick__title">{a.street}</span>
                        <span className="fc-pick__sub">{[a.betweenStreets && `e/ ${a.betweenStreets}`, a.buildingApartment].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
            {places.length > 0 && <div className="fc-note">{t('onlyDeliver', { places: places.join(', ') })}</div>}
            <TextField
              label={t('giftMessageLabel')}
              placeholder={t('giftPlaceholder')}
              maxLength={500}
              value={giftMessage}
              onChange={setGiftMessage}
            />
          </Section>

          <Section n={3} title={t('s3')}>
            {transferAvailable && (
              <div className="fc-picks">
                <button type="button" className="fc-pick" aria-pressed={paying === 'card'} onClick={() => setPayment('card')}>
                  <span className="fc-pick__icon">{paying === 'card' ? <Check size={16} aria-hidden /> : <CreditCard size={16} aria-hidden />}</span>
                  <span className="fc-pick__text">
                    <span className="fc-pick__title">{t('payCard')}</span>
                    <span className="fc-pick__sub">{t('payCardSub')}</span>
                  </span>
                </button>
                <button type="button" className="fc-pick" aria-pressed={paying === 'transfer'} onClick={() => setPayment('transfer')}>
                  <span className="fc-pick__icon">{paying === 'transfer' ? <Check size={16} aria-hidden /> : <ArrowLeftRight size={16} aria-hidden />}</span>
                  <span className="fc-pick__text">
                    <span className="fc-pick__title">{t('payTransfer')}</span>
                    <span className="fc-pick__sub">{t('payTransferSub')}</span>
                  </span>
                </button>
              </div>
            )}
            {paying === 'card' ? (
              <div className="fc-cardinfo">
                <CreditCard size={22} aria-hidden />
                <div>
                  <div className="fc-cardinfo__title">{t('cardTitle')}</div>
                  <div className="fc-cardinfo__text">{t('cardNote')}</div>
                </div>
              </div>
            ) : (
              <div className="fc-cardinfo">
                <ArrowLeftRight size={22} aria-hidden />
                <div>
                  <div className="fc-cardinfo__title">{t('transferTitle')}</div>
                  <div className="fc-cardinfo__text">{t('transferNote')}</div>
                </div>
              </div>
            )}
          </Section>

          <div className="fc-cart__paymobile">
            {formError && (
              <div className="fc-auth__error" role="alert">
                {formError}
              </div>
            )}
            {payButton}
          </div>
        </div>

        <Card padding={20} className="fc-cart__summary fc-cart__summary--first">
          <div className="fc-cart__summary-title">{t('summary')}</div>
          <div className="fc-sumlines">
            {items.map((item) => {
              const name = item.product ? localized(locale, item.product.nameEs, item.product.nameEn) : ts('panel.unavailable');
              return (
                <div key={item.productId} className="fc-sumline">
                  <span className="fc-sumline__photo">
                    <Photo picture={item.product?.picture ?? null} alt={name} variant="thumb" sizes="36px" radius={8} />
                  </span>
                  <span className="fc-sumline__name">
                    {name} <span className="fc-sumline__qty">× {item.quantity}</span>
                  </span>
                  <span className="fc-sumline__price">{formatUsd(item.lineTotalCents)}</span>
                </div>
              );
            })}
          </div>
          <div className="fc-totals__rule" />
          <FreeShipProgress subtotalCents={subtotalCents} freeOverCents={freeOverCents} />
          <Totals subtotalCents={subtotalCents} feeCents={feeCents} />
          {blockers.length > 0 && (
            <ul className="fc-blockers" role="alert">
              {blockers.map((b) => (
                <li key={b}>{t(`blockers.${b}`)}</li>
              ))}
            </ul>
          )}
          {places.length > 0 && (
            <div className="fc-samedaychip">
              <Truck size={16} aria-hidden />
              {ts('sameDay', { place: places.join(', ') })}
            </div>
          )}
          <div className="fc-cart__paydesktop">
            {formError && (
              <div className="fc-auth__error" role="alert">
                {formError}
              </div>
            )}
            {payButton}
          </div>
        </Card>
      </div>
    </div>
  );
}
