'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Clock, Copy, ExternalLink } from 'lucide-react';
import { OwnerPhotos } from '@/components/media/OwnerPhotos';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { formatDate, formatUsd } from '@/lib/format';
import { useGetManagedMediaQuery } from '@/store/api/mediaApi';
import { useReportTransferMutation } from '@/store/api/ordersApi';
import type { ManualMethodName, PaymentInstructions } from '@/store/api/ordersApi';

function reasonOf(err: unknown): string | null {
  return (err as { data?: { error?: { details?: { reason?: string } } } } | null)?.data?.error?.details?.reason ?? null;
}

/** A value the buyer has to type into another app, with a one-tap copy. */
function CopyValue({ value, label }: { value: string; label: string }) {
  const t = useTranslations('orders.manual');
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // No clipboard permission: the value is on screen to select by hand.
    }
  }
  return (
    <span className="fc-copyvalue">
      <span className="fc-mono">{value}</span>
      <button type="button" className="fc-copyvalue__btn" onClick={copy} aria-label={`${t('copy')}: ${label}`}>
        {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        {copied ? t('copied') : t('copy')}
      </button>
    </span>
  );
}

/**
 * Paying an order by transfer (Zelle / Cash App / PayPal): who to pay and exactly how much, an app
 * link for each, then "I sent it" with the confirmation number and a screenshot, which an admin
 * checks against the store's account before marking the order paid. Nothing here moves money.
 */
export function ManualPaymentCard({ info }: { info: PaymentInstructions }) {
  const t = useTranslations('orders.manual');
  const locale = useLocale();
  const [report, { isLoading }] = useReportTransferMutation();
  const { data: shots = [] } = useGetManagedMediaQuery({ ownerType: 'payment_proof', ownerId: info.orderId });

  const [editing, setEditing] = useState(info.report === null);
  const [method, setMethod] = useState<ManualMethodName | null>(info.report?.method ?? info.methods[0]?.method ?? null);
  const [reference, setReference] = useState(info.report?.transferReference ?? '');
  const [notes, setNotes] = useState(info.report?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const amount = formatUsd(info.amountCents);
  const hasShot = shots.some((s) => s.status !== 'failed');
  const uploading = shots.some((s) => s.status === 'pending');

  async function submit() {
    if (!method) return;
    if (reference.trim().length < 3) {
      setError(t('errReference'));
      return;
    }
    if (!hasShot) {
      setError(t('errScreenshot'));
      return;
    }
    setError(null);
    try {
      await report({ id: info.orderId, method, transferReference: reference.trim(), notes: notes.trim() || undefined }).unwrap();
      setEditing(false);
    } catch (err) {
      setError(reasonOf(err) === 'SCREENSHOT_REQUIRED' ? t('errScreenshot') : t('errFailed'));
    }
  }

  return (
    <Card padding={20} style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div className="fc-settings__cardtitle">{t('title')}</div>
        <div className="fc-note">{t('lead')}</div>
      </div>

      <div className="fc-manual__amount">
        <div>
          <div className="fc-manual__label">{t('amount')}</div>
          <div className="fc-manual__value">{amount}</div>
        </div>
        <div>
          <div className="fc-manual__label">{t('reference')}</div>
          <CopyValue value={info.reference} label={t('reference')} />
        </div>
      </div>
      <div className="fc-note">{t('referenceHint', { reference: info.reference })}</div>

      {info.methods.length === 0 ? (
        <div className="fc-auth__error" role="alert">{t('noMethods')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="fc-field__label">{t('step1')}</div>
          {info.methods.map((m) => (
            <div key={m.method} className="fc-manual__method">
              <div className="fc-manual__methodhead">
                <strong>{m.label}</strong>
                <span className="fc-note">{m.link ? (m.amountInLink ? t('linkWithAmount') : t('linkNoAmount', { amount })) : t('bankApp')}</span>
              </div>
              <div className="fc-manual__row">
                <span className="fc-note">{t('sendTo')}</span>
                <CopyValue value={m.recipient} label={m.label} />
              </div>
              {m.payeeName && (
                <div className="fc-manual__row">
                  <span className="fc-note">{t('name')}</span>
                  <span>{m.payeeName}</span>
                </div>
              )}
              {m.link && (
                <a className="fc-btn fc-btn--secondary" href={m.link} target="_blank" rel="noopener noreferrer">
                  {t('open', { app: m.label })}
                  <ExternalLink size={16} aria-hidden />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {info.report && !editing ? (
        <div className="fc-manual__status" role="status">
          <Clock size={20} aria-hidden />
          <div style={{ display: 'grid', gap: 4 }}>
            <strong>{t('checking')}</strong>
            <span className="fc-note">
              {t('reportedSummary', {
                app: info.methods.find((m) => m.method === info.report?.method)?.label ?? info.report.method,
                reference: info.report.transferReference,
                date: formatDate(info.report.reportedAt, locale),
              })}
            </span>
            <button type="button" className="fc-manual__link" onClick={() => setEditing(true)}>
              {t('correct')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="fc-field__label">{t('step2')}</div>
          <SegmentedControl<ManualMethodName>
            size="md"
            label={t('whichApp')}
            value={method ?? info.methods[0]?.method ?? 'zelle'}
            onChange={setMethod}
            options={info.methods.map((m) => ({ value: m.method, label: m.label }))}
          />
          <TextField label={t('transferNumber')} hint={t('transferNumberHint')} value={reference} onChange={setReference} autoComplete="off" />
          <OwnerPhotos ownerType="payment_proof" ownerId={info.orderId} ns="orders.manual.photos" />
          <TextArea label={t('notes')} value={notes} onChange={setNotes} rows={2} maxLength={500} />
          {error && (
            <div className="fc-auth__error" role="alert">
              {error}
            </div>
          )}
          <Button size="lg" block loading={isLoading} disabled={uploading || !method} onClick={submit}>
            {uploading ? t('uploading') : t('send')}
          </Button>
        </div>
      )}
    </Card>
  );
}
