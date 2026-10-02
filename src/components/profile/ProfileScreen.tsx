'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Languages, LogOut, Mail, Moon, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { BLANK_RECIPIENT, RecipientFields, validateRecipient } from '@/components/checkout/RecipientFields';
import type { RecipientErrors, RecipientForm } from '@/components/checkout/RecipientFields';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { PageHead } from '@/components/layout/PageHead';
import { useTheme } from '@/components/layout/ThemeToggle';
import { useAddressText } from '@/components/orders/useAddressText';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { useRequireRole } from '@/lib/useRequireRole';
import { useDeliveryTerms } from '@/lib/useDeliveryTerms';
import { useSignOutMutation } from '@/store/api/authApi';
import {
  useAddAddressMutation,
  useCreateRecipientMutation,
  useDeleteRecipientMutation,
  useGetRecipientsQuery,
  useUpdateAddressMutation,
  useUpdateRecipientMutation,
} from '@/store/api/recipientsApi';
import type { Recipient } from '@/store/api/recipientsApi';

type Editing = { id: string | null; form: RecipientForm };

function formOf(r: Recipient): RecipientForm {
  const a = r.addresses[0];
  return {
    name: r.fullName,
    phone: r.phone1,
    phone2: r.phone2 ?? '',
    provinceId: a?.provinceId ?? '',
    municipalityId: a?.municipalityId ?? '',
    street: a?.street ?? '',
    between: a?.betweenStreets ?? '',
    building: a?.buildingApartment ?? '',
    neighborhood: a?.neighborhood ?? '',
    reference: a?.referencePoints ?? '',
  };
}

function RecipientCard({ recipient, onEdit, onDelete }: { recipient: Recipient; onEdit: () => void; onDelete: () => void }) {
  const t = useTranslations('profile');
  const address = recipient.addresses[0] ?? null;
  const { line, area } = useAddressText(address);
  return (
    <Card className="fc-rec">
      <div className="fc-rec__body">
        <div className="fc-rec__name">{recipient.fullName}</div>
        <div className="fc-rec__phone">{[recipient.phone1, recipient.phone2].filter(Boolean).join(' · ')}</div>
        {address && <div className="fc-rec__addr">{line}</div>}
        {area && <div className="fc-rec__area">{area}</div>}
      </div>
      <IconButton icon={Pencil} variant="plain" size={36} label={t('edit')} onClick={onEdit} />
      <IconButton icon={Trash2} variant="plain" size={36} label={t('delete')} onClick={onDelete} />
    </Card>
  );
}

/** Account, preferences and the address book (design: Profile). */
export function ProfileScreen() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tch = useTranslations('checkout');
  const router = useRouter();
  const { me, isReady } = useRequireRole('buyer', '/account/sign-in');
  const { theme, setTheme } = useTheme();
  const { zones } = useDeliveryTerms();

  const { data: recipients = [] } = useGetRecipientsQuery(undefined, { skip: !isReady });
  const [createRecipient] = useCreateRecipientMutation();
  const [updateRecipient] = useUpdateRecipientMutation();
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteRecipient] = useDeleteRecipientMutation();
  const [signOut] = useSignOutMutation();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<RecipientErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleting, setDeleting] = useState<Recipient | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  function open(next: Editing | null) {
    setEditing(next);
    setErrors({});
    setSaveError(false);
  }

  async function save() {
    if (!editing) return;
    const { form } = editing;
    const found = validateRecipient(form, tch);
    setErrors(found);
    if (Object.keys(found).length) return;

    const provinceId = form.provinceId || zones.find((z) => z.municipalityId === form.municipalityId)?.province.id || '';
    const address = {
      provinceId,
      municipalityId: form.municipalityId,
      street: form.street.trim(),
      betweenStreets: form.between.trim() || undefined,
      buildingApartment: form.building.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      referencePoints: form.reference.trim() || undefined,
    };
    setSaving(true);
    setSaveError(false);
    try {
      if (editing.id === null) {
        await createRecipient({ fullName: form.name.trim(), phone1: form.phone.trim(), phone2: form.phone2.trim() || undefined, address }).unwrap();
      } else {
        const current = recipients.find((r) => r.id === editing.id);
        await updateRecipient({ id: editing.id, fullName: form.name.trim(), phone1: form.phone.trim(), phone2: form.phone2.trim() || null }).unwrap();
        const first = current?.addresses[0];
        // Empty optional fields are sent as null so a cleared field is actually cleared.
        const patch = { ...address, betweenStreets: form.between.trim() || null, buildingApartment: form.building.trim() || null, neighborhood: form.neighborhood.trim() || null, referencePoints: form.reference.trim() || null };
        if (first) await updateAddress({ recipientId: editing.id, addressId: first.id, ...patch }).unwrap();
        else await addAddress({ recipientId: editing.id, ...address }).unwrap();
      }
      open(null);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function logOut() {
    try {
      await signOut().unwrap();
    } finally {
      router.replace('/');
    }
  }

  if (!isReady || !me) {
    return (
      <div className="fc-page">
        <PageHead title={t('title')} />
      </div>
    );
  }

  const initial = (me.fullName ?? me.email).trim().charAt(0).toUpperCase();

  return (
    <div className="fc-page">
      <PageHead title={t('title')} />
      <div className="fc-profile">
        <div className="fc-profile__col">
          <Card className="fc-profile__who">
            <span className="fc-avatar" aria-hidden>
              {initial}
            </span>
            <div>
              <div className="fc-profile__name">{me.fullName ?? me.email}</div>
              <div className="fc-profile__meta">{[me.fullName ? me.email : null, me.phone].filter(Boolean).join(' · ')}</div>
            </div>
          </Card>

          <List header={t('account')}>
            <ListRow icon={Package} href="/account" title={t('myOrders')} />
            {me.emailVerified ? (
              <ListRow icon={Check} iconBg="var(--green-600)" title={t('emailVerified')} subtitle={me.email} />
            ) : (
              <ListRow icon={Mail} iconBg="var(--amber-500)" href="/account/verify-email" title={t('emailPending')} subtitle={t('emailPendingHint')} />
            )}
          </List>

          <List header={t('preferences')}>
            <ListRow icon={Languages} iconBg="var(--blue-500)" title={t('language')} accessory={<LocaleSwitcher always />} />
            <ListRow icon={Moon} iconBg="var(--gray-700)" title={t('darkMode')} accessory={<Toggle label={t('darkMode')} checked={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />} />
          </List>

          <Button variant="destructive" icon={LogOut} block onClick={() => setConfirmLogout(true)}>
            {t('logout')}
          </Button>
        </div>

        <div className="fc-profile__col" style={{ gap: 12 }}>
          <div className="fc-rechead">
            <div className="fc-rechead__title">{t('recipients')}</div>
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => open({ id: null, form: BLANK_RECIPIENT })}>
              {t('new')}
            </Button>
          </div>
          {recipients.length === 0 ? (
            <Card variant="grouped" className="fc-note" style={{ textAlign: 'center', padding: 24 }}>
              {t('noRecipients')}
            </Card>
          ) : (
            <div className="fc-reclist">
              {recipients.map((r) => (
                <RecipientCard key={r.id} recipient={r} onEdit={() => open({ id: r.id, form: formOf(r) })} onDelete={() => setDeleting(r)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => open(null)}
        title={editing?.id ? t('editRecipient') : t('newRecipient')}
        closeLabel={tc('close')}
        footer={
          <>
            {saveError && (
              <div className="fc-auth__error" role="alert" style={{ marginBottom: 10 }}>
                {tc('error')}
              </div>
            )}
            <Button block size="lg" loading={saving} onClick={save}>
              {tc('save')}
            </Button>
          </>
        }
      >
        {editing && (
          <RecipientFields
            value={editing.form}
            errors={errors}
            zones={zones}
            onChange={(patch) => setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e))}
          />
        )}
      </Modal>

      <Alert
        open={deleting !== null}
        title={t('deleteTitle')}
        message={t('deleteText')}
        cancelLabel={tc('cancel')}
        confirmLabel={tc('delete')}
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteRecipient(deleting.id)}
      />
      <Alert
        open={confirmLogout}
        title={t('logoutTitle')}
        message={t('logoutText')}
        cancelLabel={tc('cancel')}
        confirmLabel={t('logout')}
        destructive
        onClose={() => setConfirmLogout(false)}
        onConfirm={logOut}
      />
    </div>
  );
}
