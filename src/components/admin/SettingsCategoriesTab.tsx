'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { CATEGORY_ICONS, categoryIcon } from '@/lib/categoryIcons';
import { localized } from '@/lib/localized';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useReorderCategoriesMutation,
  useUpdateCategoryMutation,
} from '@/store/api/catalogApi';
import type { AdminCategory } from '@/store/api/catalogApi';

interface Draft {
  id: string | null;
  nameEs: string;
  nameEn: string;
  icon: string | null;
  active: boolean;
}

/** The categories buyers filter by: name in both languages, a glyph, order, visibility. */
export function SettingsCategoriesTab() {
  const t = useTranslations('adm.settings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { data: categories = [] } = useGetAdminCategoriesQuery();
  const [create] = useCreateCategoryMutation();
  const [update] = useUpdateCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [reorder] = useReorderCategoriesMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    if (!draft || !draft.nameEs.trim()) {
      setError(true);
      return;
    }
    setSaving(true);
    setError(false);
    const body = { nameEs: draft.nameEs.trim(), nameEn: draft.nameEn.trim() || undefined, icon: draft.icon, active: draft.active };
    try {
      if (draft.id === null) await create(body).unwrap();
      else await update({ id: draft.id, ...body, nameEn: body.nameEn ?? body.nameEs }).unwrap();
      setDraft(null);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const move = (index: number, by: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    void reorder(ids);
  };

  return (
    <Card padding={24} style={{ display: 'grid', gap: 14, maxWidth: 720 }}>
      <div className="fc-rechead">
        <div className="fc-settings__cardtitle" style={{ flex: 1 }}>{t('categories')}</div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => { setDraft({ id: null, nameEs: '', nameEn: '', icon: null, active: true }); setError(false); }}>
          {t('addCategory')}
        </Button>
      </div>
      <div className="fc-zonelist">
        {categories.map((c, i) => {
          const Icon = categoryIcon(c.icon) ?? Tag;
          return (
            <div key={c.id} className="fc-zonerow">
              <span className="fc-row__tile" style={{ ['--tile' as string]: 'var(--accent)' }}><Icon size={18} aria-hidden /></span>
              <div className="fc-row__body">
                <div className="fc-row__title">{localized(locale, c.nameEs, c.nameEn)}</div>
                {c.nameEn !== c.nameEs && <div className="fc-row__sub">{locale === 'en' ? c.nameEs : c.nameEn}</div>}
              </div>
              <IconButton icon={ArrowUp} variant="plain" size={32} label={t('moveUp')} disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon={ArrowDown} variant="plain" size={32} label={t('moveDown')} disabled={i === categories.length - 1} onClick={() => move(i, 1)} />
              <Toggle label={t('active')} checked={c.active} onChange={(active) => update({ id: c.id, active })} />
              <IconButton icon={Pencil} variant="plain" size={32} label={t('edit')} onClick={() => { setDraft({ id: c.id, nameEs: c.nameEs, nameEn: c.nameEn, icon: c.icon, active: c.active }); setError(false); }} />
              <IconButton icon={Trash2} variant="plain" size={32} label={t('delete')} onClick={() => setToDelete(c)} />
            </div>
          );
        })}
        {categories.length === 0 && <div className="fc-note">{t('noCategories')}</div>}
      </div>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('editCategory') : t('addCategory')}
        closeLabel={tc('close')}
        footer={
          <>
            {error && <div className="fc-auth__error" role="alert" style={{ marginBottom: 10 }}>{tc('error')}</div>}
            <Button block size="lg" loading={saving} onClick={save}>{tc('save')}</Button>
          </>
        }
      >
        {draft && (
          <div className="fc-form">
            <div className="fc-form__row">
              <TextField label={t('nameEs')} value={draft.nameEs} onChange={(v) => setDraft({ ...draft, nameEs: v })} />
              <TextField label={t('nameEn')} value={draft.nameEn} onChange={(v) => setDraft({ ...draft, nameEn: v })} />
            </div>
            <div className="fc-form" style={{ gap: 8 }}>
              <span className="fc-field__label">{t('icon')}</span>
              <div className="fc-chipwrap">
                {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
                  <Chip key={name} active={draft.icon === name} icon={Icon} onClick={() => setDraft({ ...draft, icon: draft.icon === name ? null : name })}>
                    {name}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="fc-switchrow">
              <Toggle label={t('active')} checked={draft.active} onChange={(active) => setDraft({ ...draft, active })} />
              {t('active')}
            </div>
          </div>
        )}
      </Modal>

      <Alert
        open={toDelete !== null}
        title={t('deleteCategoryTitle')}
        message={t('deleteCategoryText')}
        cancelLabel={tc('cancel')}
        confirmLabel={tc('delete')}
        destructive
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove(toDelete.id)}
      />
    </Card>
  );
}
