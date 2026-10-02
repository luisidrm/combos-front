'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DeliveryPhotos } from '@/components/fulfilment/DeliveryPhotos';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { useDeliverMutation } from '@/store/api/fulfilmentApi';

function reasonOf(err: unknown): string | null {
  return (err as { data?: { error?: { details?: { reason?: string } } } } | null)?.data?.error?.details?.reason ?? null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  /** Pre-filled: it is almost always the person the order was addressed to. */
  recipientName: string;
}

/** Hand-over: who received it, an optional note and the photo. Marks the order delivered. */
export function DeliverModal({ open, onClose, orderId, orderNumber, recipientName }: Props) {
  const t = useTranslations('fulfil.deliver');
  const tc = useTranslations('common');
  const [deliver, { isLoading }] = useDeliverMutation();
  const [name, setName] = useState(recipientName);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setError(null);
    try {
      await deliver({ orderId, recipientName: name.trim(), notes: notes.trim() || undefined }).unwrap();
      onClose();
    } catch (err) {
      const reason = reasonOf(err);
      setError(reason === 'DELIVERY_PHOTO_REQUIRED' ? t('photoRequired') : reason === 'ILLEGAL_TRANSITION' ? t('stale') : t('failed'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title', { number: orderNumber })}
      closeLabel={tc('close')}
      footer={
        <>
          {error && (
            <div className="fc-auth__error" role="alert" style={{ marginBottom: 10 }}>
              {error}
            </div>
          )}
          <Button block size="lg" loading={isLoading} onClick={confirm}>
            {t('confirm')}
          </Button>
        </>
      }
    >
      <div className="fc-form">
        <TextField label={t('receivedBy')} value={name} onChange={setName} autoComplete="off" />
        <DeliveryPhotos orderId={orderId} />
        <TextArea label={t('notes')} value={notes} onChange={setNotes} rows={2} />
      </div>
    </Modal>
  );
}
