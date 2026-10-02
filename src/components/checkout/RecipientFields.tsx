'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Phone, User } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { localized } from '@/lib/localized';
import type { DeliveryZone } from '@/store/api/geoApi';

export interface RecipientForm {
  name: string;
  phone: string;
  phone2: string;
  provinceId: string;
  municipalityId: string;
  street: string;
  between: string;
  building: string;
  neighborhood: string;
  reference: string;
}

export const BLANK_RECIPIENT: RecipientForm = {
  name: '',
  phone: '+53 ',
  phone2: '',
  provinceId: '',
  municipalityId: '',
  street: '',
  between: '',
  building: '',
  neighborhood: '',
  reference: '',
};

/**
 * The form as the buyer sees it. When the store delivers to a single province / municipality the form
 * shows them as locked, pre-filled boxes without the buyer choosing anything, so the stored ids are
 * still empty: fill them in here. Everything that reads the form (validation, the fee, the saved
 * address) must go through this, or a place that merely looks selected counts as missing.
 */
export function resolveRecipientForm(form: RecipientForm, zones: DeliveryZone[]): RecipientForm {
  const provinceIds = [...new Set(zones.map((z) => z.province.id))];
  const provinceId = form.provinceId || (provinceIds.length === 1 ? (provinceIds[0] ?? '') : '');
  // Mirrors RecipientFields: the municipality is locked only when there is one province and one place.
  const places = zones.filter((z) => z.province.id === provinceId);
  const municipalityId = form.municipalityId || (provinceIds.length <= 1 && places.length === 1 ? (places[0]?.municipalityId ?? '') : '');
  return { ...form, provinceId, municipalityId };
}

export type RecipientErrors = Partial<Record<'name' | 'phone' | 'municipality' | 'street', string>>;

/** The same checks the API makes, so the buyer finds out before the round trip. */
export function validateRecipient(form: RecipientForm, t: (key: 'errName' | 'errPhone' | 'errStreet' | 'errMunicipality') => string): RecipientErrors {
  const errors: RecipientErrors = {};
  if (!form.name.trim()) errors.name = t('errName');
  if (form.phone.replace(/\D/g, '').length < 10) errors.phone = t('errPhone');
  if (!form.municipalityId) errors.municipality = t('errMunicipality');
  if (!form.street.trim()) errors.street = t('errStreet');
  return errors;
}

interface Props {
  value: RecipientForm;
  errors: RecipientErrors;
  onChange: (patch: Partial<RecipientForm>) => void;
  /** Active delivery zones: the only places the buyer may choose. */
  zones: DeliveryZone[];
}

/** Recipient + address fields of the checkout (design: PersonFields + AddressFields). */
export function RecipientFields({ value, errors, onChange, zones }: Props) {
  const t = useTranslations('checkout');
  const locale = useLocale();

  const provinces = [...new Map(zones.map((z) => [z.province.id, z.province])).values()];
  const provinceId = value.provinceId || (provinces.length === 1 ? (provinces[0]?.id ?? '') : '');
  const municipalities = zones.filter((z) => z.province.id === provinceId);
  const name = (n: { nameEs: string; nameEn: string }) => localized(locale, n.nameEs, n.nameEn);

  return (
    <div className="fc-form">
      <div className="fc-form__row">
        <TextField label={t('fullName')} icon={User} autoComplete="off" placeholder="Carmen Medina" value={value.name} onChange={(v) => onChange({ name: v })} error={errors.name} />
        <TextField
          label={t('phone')}
          icon={Phone}
          type="tel"
          placeholder="+53 5 123 4567"
          value={value.phone}
          onChange={(v) => onChange({ phone: v })}
          error={errors.phone}
          hint={errors.phone ? undefined : t('phoneHint')}
        />
      </div>
      <TextField label={t('phone2')} icon={Phone} type="tel" value={value.phone2} onChange={(v) => onChange({ phone2: v })} />

      <div className="fc-form__row">
        {provinces.length <= 1 ? (
          <TextField label={t('province')} value={provinces[0] ? name(provinces[0]) : ''} disabled readOnly />
        ) : (
          <Select
            label={t('province')}
            placeholder="—"
            value={provinceId}
            options={provinces.map((p) => ({ value: p.id, label: name(p) }))}
            onChange={(v) => onChange({ provinceId: v, municipalityId: '' })}
          />
        )}
        {municipalities.length === 1 && provinces.length <= 1 ? (
          <TextField label={t('municipality')} value={name(municipalities[0]!.municipality)} disabled readOnly />
        ) : (
          <Select
            label={t('municipality')}
            placeholder={t('chooseMunicipality')}
            value={value.municipalityId}
            disabled={!provinceId}
            options={municipalities.map((z) => ({ value: z.municipalityId, label: name(z.municipality) }))}
            onChange={(v) => onChange({ provinceId, municipalityId: v })}
            error={errors.municipality}
          />
        )}
      </div>

      <div className="fc-form__row">
        <TextField label={t('street')} icon={MapPin} placeholder="Calle Maceo #214" value={value.street} onChange={(v) => onChange({ street: v })} error={errors.street} />
        <TextField label={t('between')} placeholder="Martí y Candelaria" value={value.between} onChange={(v) => onChange({ between: v })} />
      </div>
      <TextField label={t('neighborhood')} value={value.neighborhood} onChange={(v) => onChange({ neighborhood: v })} maxLength={100} />
      <TextField label={t('building')} value={value.building} onChange={(v) => onChange({ building: v })} />
      <TextField label={t('reference')} value={value.reference} onChange={(v) => onChange({ reference: v })} hint={t('referenceHint')} />
    </div>
  );
}
