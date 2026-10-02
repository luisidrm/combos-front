'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Mail, MapPin, Phone, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { List } from '@/components/ui/List';
import { ListRow } from '@/components/ui/ListRow';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { useUpdateTenantMutation } from '@/store/api/tenancyApi';
import type { OpeningHours, PublicTenant, TenantSettings } from '@/store/api/tenancyApi';

const DEFAULT_DAY = { open: '08:00', close: '18:00' };

// Monday-first weekday names in the viewer's language (2024-01-01 was a Monday).
function weekdayNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 0, 1 + i))));
}

/** Shop profile, opening hours and the delivery-photo switch (design: Settings → "Tienda y horario"). */
export function SettingsShopTab({ tenant, settings }: { tenant: PublicTenant; settings: TenantSettings }) {
  const t = useTranslations('adm.settings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [updateTenant, { isLoading }] = useUpdateTenantMutation();

  const [name, setName] = useState(tenant.name);
  const [phone, setPhone] = useState(settings.contact.phone ?? '');
  const [email, setEmail] = useState(settings.contact.email ?? '');
  const [address, setAddress] = useState(settings.contact.address ?? '');
  const [hours, setHours] = useState<OpeningHours>(settings.openingHours ?? Array.from({ length: 7 }, (_, i) => (i < 6 ? DEFAULT_DAY : null)));
  const [photo, setPhoto] = useState(settings.requireDeliveryPhoto);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const days = weekdayNames(locale);

  const setDay = (i: number, value: { open: string; close: string } | null) => {
    setSaved(false);
    setHours((h) => h.map((d, j) => (j === i ? value : d)));
  };

  async function save() {
    setError(false);
    try {
      await updateTenant({
        name: name.trim(),
        settings: { contact: { phone, email, address }, openingHours: hours, requireDeliveryPhoto: photo },
      }).unwrap();
      setSaved(true);
    } catch {
      setError(true);
    }
  }

  return (
    <div className="fc-settingsgrid">
      <Card padding={24} style={{ display: 'grid', gap: 14 }}>
        <div className="fc-settings__cardtitle">{t('shopProfile')}</div>
        <TextField label={t('name')} icon={Store} value={name} onChange={(v) => { setName(v); setSaved(false); }} />
        <TextField label={t('phone')} icon={Phone} type="tel" value={phone} onChange={(v) => { setPhone(v); setSaved(false); }} />
        <TextField label={t('email')} icon={Mail} type="email" value={email} onChange={(v) => { setEmail(v); setSaved(false); }} />
        <TextField label={t('address')} icon={MapPin} value={address} onChange={(v) => { setAddress(v); setSaved(false); }} />
        <List>
          <ListRow title={t('requirePhoto')} subtitle={t('requirePhotoHint')} accessory={<Toggle label={t('requirePhoto')} checked={photo} onChange={(v) => { setPhoto(v); setSaved(false); }} />} />
        </List>
        {error && <div className="fc-auth__error" role="alert">{tc('error')}</div>}
        <div>
          <Button icon={saved ? Check : undefined} loading={isLoading} onClick={save}>
            {saved ? t('saved') : t('save')}
          </Button>
        </div>
      </Card>

      <List header={t('hours')}>
        {days.map((day, i) => {
          const value = hours[i] ?? null;
          return (
            <div key={day} className="fc-row fc-hoursrow">
              <div className="fc-row__body">
                <div className="fc-row__title" style={{ textTransform: 'capitalize' }}>{day}</div>
              </div>
              {value ? (
                <span className="fc-hoursrow__times">
                  <input type="time" aria-label={`${day} ${t('opens')}`} className="fc-timeinput" value={value.open} onChange={(e) => setDay(i, { ...value, open: e.target.value })} />
                  –
                  <input type="time" aria-label={`${day} ${t('closes')}`} className="fc-timeinput" value={value.close} onChange={(e) => setDay(i, { ...value, close: e.target.value })} />
                </span>
              ) : (
                <span className="fc-row__value">{t('closed')}</span>
              )}
              <Toggle label={day} checked={value !== null} onChange={(on) => setDay(i, on ? DEFAULT_DAY : null)} />
            </div>
          );
        })}
        <div className="fc-note" style={{ padding: '10px 16px' }}>{t('hoursNote')}</div>
      </List>
    </div>
  );
}
