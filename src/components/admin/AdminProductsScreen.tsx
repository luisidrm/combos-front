'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminFrame';
import { ProductPhotos } from '@/components/admin/ProductPhotos';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Photo } from '@/components/ui/Photo';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { categoryIcon } from '@/lib/categoryIcons';
import { formatUsd } from '@/lib/format';
import { localized } from '@/lib/localized';
import {
  useActivateProductMutation,
  useCreateProductMutation,
  useDeactivateProductMutation,
  useDeleteProductMutation,
  useGetAdminCategoriesQuery,
  useGetAdminProductsQuery,
  useUpdateProductMutation,
} from '@/store/api/catalogApi';
import type { AdminProduct, StockStatus } from '@/store/api/catalogApi';
import { useGetMeQuery } from '@/store/api/identityApi';

const STOCK: StockStatus[] = ['available', 'limited', 'out'];

interface Draft {
  id: string | null;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  categoryId: string | null;
  unitLabel: string;
  price: string;
  stockStatus: StockStatus;
  maxPerOrder: string;
}

const BLANK: Draft = { id: null, nameEs: '', nameEn: '', descriptionEs: '', descriptionEn: '', categoryId: null, unitLabel: '', price: '', stockStatus: 'available', maxPerOrder: '' };

function draftOf(p: AdminProduct): Draft {
  return {
    id: p.id,
    nameEs: p.nameEs,
    nameEn: p.nameEn,
    descriptionEs: p.descriptionEs ?? '',
    descriptionEn: p.descriptionEn ?? '',
    categoryId: p.categoryId,
    unitLabel: p.unitLabel,
    price: (p.priceCents / 100).toFixed(2),
    stockStatus: p.stockStatus,
    maxPerOrder: p.maxPerOrder ? String(p.maxPerOrder) : '',
  };
}

function reasonOf(err: unknown): string | null {
  return (err as { data?: { error?: { details?: { reason?: string } } } } | null)?.data?.error?.details?.reason ?? null;
}

/** Catalog management (design: AdminCatalog). Admins edit everything; the packer only flips availability and visibility. */
export function AdminProductsScreen() {
  const t = useTranslations('adm.products');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { data: me } = useGetMeQuery();
  const isAdmin = me?.role === 'admin';
  const { data: products = [] } = useGetAdminProductsQuery();
  const { data: categories = [] } = useGetAdminCategoriesQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [activate] = useActivateProductMutation();
  const [deactivate] = useDeactivateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const catName = (id: string | null) => {
    const c = categories.find((x) => x.id === id);
    return c ? localized(locale, c.nameEs, c.nameEn) : '—';
  };
  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter(
      (p) => (category === null || p.categoryId === category) && (needle === '' || `${p.nameEs} ${p.nameEn}`.toLowerCase().includes(needle)),
    );
  }, [products, category, query]);
  const lowCount = products.filter((p) => p.stockStatus !== 'available').length;
  const stockLabel = (s: StockStatus) => t(`stock.${s}`);

  async function toggleVisible(p: AdminProduct, on: boolean) {
    setNotice(null);
    try {
      await (on ? activate(p.id) : deactivate(p.id)).unwrap();
    } catch (err) {
      setNotice(reasonOf(err) === 'NO_READY_PICTURE' ? t('needPhoto', { name: localized(locale, p.nameEs, p.nameEn) }) : tc('error'));
    }
  }

  async function save() {
    if (!draft) return;
    const cents = Math.round(parseFloat(draft.price.replace(',', '.')) * 100);
    if (!draft.nameEs.trim() || !draft.unitLabel.trim() || !Number.isFinite(cents) || cents <= 0) {
      setFormError(t('invalid'));
      return;
    }
    const body = {
      nameEs: draft.nameEs.trim(),
      nameEn: draft.nameEn.trim() || undefined,
      descriptionEs: draft.descriptionEs.trim() || null,
      descriptionEn: draft.descriptionEn.trim() || null,
      categoryId: draft.categoryId,
      unitLabel: draft.unitLabel.trim(),
      priceCents: cents,
      stockStatus: draft.stockStatus,
      maxPerOrder: draft.maxPerOrder ? Number(draft.maxPerOrder) : null,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (draft.id === null) {
        const created = await createProduct(body).unwrap();
        // A new product is a draft with no photos yet: keep the editor open so they can be added right away.
        setDraft({ ...draft, id: created.id });
      } else {
        await updateProduct({ id: draft.id, ...body, nameEn: body.nameEn ?? body.nameEs }).unwrap();
        setDraft(null);
      }
    } catch {
      setFormError(tc('error'));
    } finally {
      setSaving(false);
    }
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const current = draft?.id ? products.find((p) => p.id === draft.id) : undefined;

  return (
    <>
      <AdminPageHead
        title={t('title')}
        actions={
          isAdmin && (
            <Button size="sm" icon={Plus} onClick={() => { setDraft(BLANK); setFormError(null); }}>
              {t('new')}
            </Button>
          )
        }
      />
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="fc-orders__filters" style={{ gridAutoFlow: 'column', gridAutoColumns: 'auto', justifyContent: 'start', alignItems: 'center' }}>
          <TextField icon={Search} type="search" className="fc-orders__search" placeholder={t('search')} aria-label={t('search')} value={query} onChange={setQuery} />
          {lowCount > 0 && <Badge tone="warning" dot>{t('lowCount', { count: lowCount })}</Badge>}
        </div>
        <div className="fc-orders__pills">
          <Chip active={category === null} icon={LayoutGrid} onClick={() => setCategory(null)}>{t('all')}</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.id} icon={categoryIcon(c.icon)} onClick={() => setCategory(c.id)}>
              {localized(locale, c.nameEs, c.nameEn)}
            </Chip>
          ))}
        </div>
        {notice && <div className="fc-auth__error" role="alert">{notice}</div>}

        <Card padding={0} style={{ overflowX: 'auto' }}>
          <table className="fc-table">
            <thead>
              <tr>
                <th>{t('colProduct')}</th>
                <th>{t('colCategory')}</th>
                <th className="fc-table__num">{t('colPrice')}</th>
                <th>{t('colStock')}</th>
                <th>{t('colVisible')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="fc-prodcell">
                      <span className="fc-sumline__photo" style={{ width: 40, height: 40, borderRadius: 10 }}>
                        <Photo picture={p.cover} alt="" variant="thumb" sizes="40px" radius={10} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{localized(locale, p.nameEs, p.nameEn)}</div>
                        <div className="fc-note">{p.unitLabel}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{catName(p.categoryId)}</td>
                  <td className="fc-table__num">{formatUsd(p.priceCents)}</td>
                  <td>
                    <Select
                      aria-label={t('colStock')}
                      value={p.stockStatus}
                      options={STOCK.map((s) => ({ value: s, label: stockLabel(s) }))}
                      onChange={(v) => updateProduct({ id: p.id, stockStatus: v as StockStatus })}
                      className="fc-stockselect"
                    />
                  </td>
                  <td>
                    <Toggle label={t('colVisible')} checked={p.active} onChange={(on) => toggleVisible(p, on)} />
                  </td>
                  <td className="fc-table__num">
                    {isAdmin && (
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        <IconButton icon={Pencil} variant="plain" size={34} label={t('edit')} onClick={() => { setDraft(draftOf(p)); setFormError(null); }} />
                        <IconButton icon={Trash2} variant="plain" size={34} label={t('delete')} onClick={() => setToDelete(p)} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="fc-table__empty">{t('empty')}</div>}
        </Card>
      </div>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('editTitle') : t('newTitle')}
        closeLabel={tc('close')}
        footer={
          <>
            {formError && <div className="fc-auth__error" role="alert" style={{ marginBottom: 10 }}>{formError}</div>}
            <Button block size="lg" loading={saving} onClick={save}>{tc('save')}</Button>
          </>
        }
      >
        {draft && (
          <div className="fc-form">
            <div className="fc-form__row">
              <TextField label={t('nameEs')} value={draft.nameEs} onChange={(v) => set({ nameEs: v })} />
              <TextField label={t('nameEn')} value={draft.nameEn} onChange={(v) => set({ nameEn: v })} />
            </div>
            <div className="fc-form" style={{ gap: 8 }}>
              <span className="fc-field__label">{t('colCategory')}</span>
              <div className="fc-chipwrap">
                {categories.map((c) => (
                  <Chip key={c.id} active={draft.categoryId === c.id} icon={categoryIcon(c.icon)} onClick={() => set({ categoryId: draft.categoryId === c.id ? null : c.id })}>
                    {localized(locale, c.nameEs, c.nameEn)}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="fc-form__row fc-form__row--3">
              <TextField label={t('unit')} placeholder="1 kg" value={draft.unitLabel} onChange={(v) => set({ unitLabel: v })} />
              <TextField label={t('price')} inputMode="decimal" placeholder="9.50" value={draft.price} onChange={(v) => set({ price: v })} />
              <TextField label={t('maxPerOrder')} inputMode="numeric" value={draft.maxPerOrder} onChange={(v) => set({ maxPerOrder: v.replace(/\D/g, '') })} />
            </div>
            <div className="fc-form" style={{ gap: 8 }}>
              <span className="fc-field__label">{t('colStock')}</span>
              <div className="fc-chipwrap">
                {STOCK.map((s) => (
                  <Chip key={s} active={draft.stockStatus === s} onClick={() => set({ stockStatus: s })}>{stockLabel(s)}</Chip>
                ))}
              </div>
            </div>
            <TextArea label={t('descriptionEs')} value={draft.descriptionEs} onChange={(v) => set({ descriptionEs: v })} />
            <TextArea label={t('descriptionEn')} value={draft.descriptionEn} onChange={(v) => set({ descriptionEn: v })} />

            {draft.id ? (
              <>
                <ProductPhotos productId={draft.id} />
                {current && (
                  <div className="fc-switchrow">
                    <Toggle label={t('visibleInShop')} checked={current.active} onChange={(on) => toggleVisible(current, on)} />
                    {t('visibleInShop')}
                  </div>
                )}
              </>
            ) : (
              <div className="fc-note">{t('photosAfterSave')}</div>
            )}
          </div>
        )}
      </Modal>

      <Alert
        open={toDelete !== null}
        title={t('deleteTitle')}
        message={t('deleteText')}
        cancelLabel={tc('cancel')}
        confirmLabel={tc('delete')}
        destructive
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteProduct(toDelete.id)}
      />
    </>
  );
}
