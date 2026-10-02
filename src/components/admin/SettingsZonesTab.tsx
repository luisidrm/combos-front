'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Clock, DollarSign, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import {
  useCreateDeliveryZoneMutation,
  useGetAdminDeliveryZonesQuery,
  useGetMunicipalitiesQuery,
  useGetProvincesQuery,
  useUpdateDeliveryZoneMutation,
} from '@/store/api/geoApi';
import type { DeliveryZone } from '@/store/api/geoApi';
import { useUpdateTenantMutation } from '@/store/api/tenancyApi';
import type { TenantSettings } from '@/store/api/tenancyApi';

const toCents = (text: string): number | null => {
  const n = Math.round(parseFloat(text.replace(',', '.')) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function ZoneRow({ zone }: { zone: DeliveryZone }) {
  const t = useTranslations('adm.settings');
  const locale = useLocale();
  const [update] = useUpdateDeliveryZoneMutation();
  const [fee, setFee] = useState((zone.feeCents / 100).toFixed(2));
  const commit = () => {
    const cents = toCents(fee);
    if (cents === null) setFee((zone.feeCents / 100).toFixed(2));
    else if (cents !== zone.feeCents) void update({ id: zone.id, feeCents: cents });
  };
  return (
    <div className="fc-zonerow">
      <div className="fc-row__body">
        <div className="fc-row__title">{localized(locale, zone.municipality.nameEs, zone.municipality.nameEn)}</div>
        <div className="fc-row__sub">{localized(locale, zone.province.nameEs, zone.province.nameEn)}</div>
      </div>
      <TextField aria-label={t('fee')} inputMode="decimal" icon={DollarSign} value={fee} className="fc-zonerow__fee" onChange={setFee} onBlur={commit} />
      <Toggle label={t('active')} checked={zone.active} onChange={(active) => update({ id: zone.id, active })} />
    </div>
  );
}

function AddZone() {
  const t = useTranslations('adm.settings');
  const locale = useLocale();
  const { data: provinces = [] } = useGetProvincesQuery();
  const [provinceId, setProvinceId] = useState('');
  const { data: municipalities = [] } = useGetMunicipalitiesQuery(provinceId, { skip: !provinceId });
  const [municipalityId, setMunicipalityId] = useState('');
  const [fee, setFee] = useState('');
  const [create, { isLoading }] = useCreateDeliveryZoneMutation();
  const [error, setError] = useState<string | null>(null);
  const cents = toCents(fee);

  async function add() {
    setError(null);
    if (!municipalityId || cents === null) return;
    try {
      await create({ municipalityId, feeCents: cents }).unwrap();
      setMunicipalityId('');
      setFee('');
    } catch (err) {
      setError((err as { status?: number }).status === 409 ? t('zoneExists') : t('failed'));
    }
  }

  return (
    <div className="fc-form" style={{ gap: 10, paddingTop: 6 }}>
      <div className="fc-settings__cardtitle" style={{ fontSize: 15 }}>{t('addZone')}</div>
      <div className="fc-form__row fc-form__row--3">
        <Select label={t('province')} placeholder="—" value={provinceId} options={provinces.map((p) => ({ value: p.id, label: localized(locale, p.nameEs, p.nameEn) }))} onChange={(v) => { setProvinceId(v); setMunicipalityId(''); }} />
        <Select label={t('municipality')} placeholder="—" value={municipalityId} disabled={!provinceId} options={municipalities.map((m) => ({ value: m.id, label: localized(locale, m.nameEs, m.nameEn) }))} onChange={setMunicipalityId} />
        <TextField label={t('fee')} inputMode="decimal" icon={DollarSign} placeholder="5.00" value={fee} onChange={setFee} />
      </div>
      {error && <div className="fc-auth__error" role="alert">{error}</div>}
      <div>
        <Button size="sm" variant="secondary" icon={Plus} loading={isLoading} disabled={!municipalityId || cents === null} onClick={add}>
          {t('addZone')}
        </Button>
      </div>
    </div>
  );
}

/** Where the shop delivers, what it charges, and the free-delivery / same-day rules (design: Settings → "Zona y envío"). */
export function SettingsZonesTab({ settings }: { settings: TenantSettings }) {
  const t = useTranslations('adm.settings');
  const tc = useTranslations('common');
  const { data: zones = [] } = useGetAdminDeliveryZonesQuery();
  const [updateTenant, { isLoading }] = useUpdateTenantMutation();
  const [freeOver, setFreeOver] = useState(settings.freeDeliveryOverCents === null ? '' : (settings.freeDeliveryOverCents / 100).toFixed(2));
  const [cutoff, setCutoff] = useState(settings.sameDayCutoff ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const freeCents = freeOver.trim() === '' ? null : toCents(freeOver);
  const invalid = freeOver.trim() !== '' && freeCents === null;
  const active = zones.filter((z) => z.active);
  const cheapest = active.length ? Math.min(...active.map((z) => z.feeCents)) : null;

  async function save() {
    setError(false);
    try {
      await updateTenant({ settings: { freeDeliveryOverCents: freeCents, sameDayCutoff: cutoff === '' ? null : cutoff } }).unwrap();
      setSaved(true);
    } catch {
      setError(true);
    }
  }

  return (
    <div className="fc-settingsgrid">
      <Card padding={24} style={{ display: 'grid', gap: 14 }}>
        <div className="fc-settings__cardtitle">{t('zones')}</div>
        <div className="fc-note">{t('zonesHint')}</div>
        <div className="fc-zonelist">
          {zones.map((z) => (
            <ZoneRow key={z.id} zone={z} />
          ))}
          {zones.length === 0 && <div className="fc-note">{t('noZones')}</div>}
        </div>
        <AddZone />
      </Card>

      <Card padding={24} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <div className="fc-settings__cardtitle">{t('delivery')}</div>
        <TextField label={t('freeOver')} icon={DollarSign} inputMode="decimal" placeholder="50.00" value={freeOver} error={invalid ? t('invalidAmount') : undefined} hint={t('freeOverHint')} onChange={(v) => { setFreeOver(v); setSaved(false); }} />
        <label className="fc-field">
          <span className="fc-field__label">{t('cutoff')}</span>
          <span className="fc-field__box">
            <Clock size={18} aria-hidden />
            <input type="time" className="fc-field__input" value={cutoff} onChange={(e) => { setCutoff(e.target.value); setSaved(false); }} />
          </span>
          <span className="fc-field__hint">{t('cutoffHint')}</span>
        </label>
        <div className="fc-previewchip">
          <Eye size={16} aria-hidden />
          {cheapest === null
            ? t('previewNone')
            : freeCents === null
              ? t('previewFee', { fee: formatUsd(cheapest) })
              : t('previewFree', { fee: formatUsd(cheapest), amount: formatUsd(freeCents) })}
        </div>
        {error && <div className="fc-auth__error" role="alert">{tc('error')}</div>}
        <div>
          <Button icon={saved ? Check : undefined} loading={isLoading} disabled={invalid} onClick={save}>
            {saved ? t('saved') : t('save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
