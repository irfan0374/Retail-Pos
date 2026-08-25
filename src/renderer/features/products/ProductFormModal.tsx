import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { CategoryFormModal } from './CategoryFormModal'
import { SupplierFormModal } from '../purchases/SupplierFormModal'
import type { Category, MakingChargeType, MetalType, NewProductInput, Product } from '@shared/types/product'
import type { Supplier } from '@shared/types/supplier'

const METAL_TYPES: MetalType[] = ['gold', 'silver', 'platinum', 'imitation']
const MAKING_CHARGE_TYPES: MakingChargeType[] = ['fixed', 'percent']

function toInput(p?: Product): NewProductInput {
  return {
    sku: p?.sku ?? null,
    name: p?.name ?? '',
    type: p?.type ?? 'gift',
    categoryId: p?.categoryId ?? null,
    metalType: p?.metalType ?? 'gold',
    purity: p?.purity ?? '22K',
    grossWeight: p?.grossWeight ?? null,
    netWeight: p?.netWeight ?? null,
    stoneWeight: p?.stoneWeight ?? null,
    makingCharge: p?.makingCharge ?? null,
    makingChargeType: p?.makingChargeType ?? 'percent',
    wastagePct: p?.wastagePct ?? null,
    isRateBased: p?.isRateBased ?? false,
    hallmarkNo: p?.hallmarkNo ?? null,
    costPrice: p?.costPrice ?? 0,
    sellingPrice: p?.sellingPrice ?? 0,
    stockQty: p?.stockQty ?? 0,
    lowStockThreshold: p?.lowStockThreshold ?? 0,
    supplierId: p?.supplierId ?? null
  }
}

export function ProductFormModal({
  categories: initialCategories,
  suppliers: initialSuppliers,
  existing,
  onClose,
  onSaved
}: {
  categories: Category[]
  suppliers: Supplier[]
  existing?: Product
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<NewProductInput>(toInput(existing))
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [categoryModal, setCategoryModal] = useState<'create' | 'edit' | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof NewProductInput>(key: K, value: NewProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (existing) {
        await window.api.products.update({ id: existing.id, ...form })
      } else {
        await window.api.products.create(form)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const isJewelry = form.type === 'jewelry'

  return (
    <Modal title={existing ? form.name : t('products.newProduct')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['jewelry', 'gift'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set('type', type)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                form.type === type
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              {t(`products.${type}`)}
            </button>
          ))}
        </div>

        <Field label={t('products.name')}>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label={t('products.category')}>
          <div className="flex gap-2">
            <select
              className="input"
              value={form.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCategoryModal('create')}
              className="btn-secondary shrink-0 px-3"
              title={t('products.newCategory')}
            >
              +
            </button>
            {form.categoryId != null && (
              <button
                type="button"
                onClick={() => setCategoryModal('edit')}
                className="btn-secondary shrink-0 px-3"
                title={t('products.editCategory')}
              >
                {t('products.edit')}
              </button>
            )}
          </div>
        </Field>

        {isJewelry ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('products.metalType')}>
                <select
                  className="input"
                  value={form.metalType ?? 'gold'}
                  onChange={(e) => set('metalType', e.target.value as MetalType)}
                >
                  {METAL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('products.purity')}>
                <input
                  className="input"
                  value={form.purity ?? ''}
                  onChange={(e) => set('purity', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label={t('products.grossWeight')}>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  value={form.grossWeight ?? ''}
                  onChange={(e) => set('grossWeight', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label={t('products.netWeight')}>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  value={form.netWeight ?? ''}
                  onChange={(e) => set('netWeight', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label={t('products.stoneWeight')}>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  value={form.stoneWeight ?? ''}
                  onChange={(e) => set('stoneWeight', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('products.makingCharge')}>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.makingCharge ?? ''}
                  onChange={(e) => set('makingCharge', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label={t('products.makingChargeType')}>
                <select
                  className="input"
                  value={form.makingChargeType ?? 'percent'}
                  onChange={(e) => set('makingChargeType', e.target.value as MakingChargeType)}
                >
                  {MAKING_CHARGE_TYPES.map((mc) => (
                    <option key={mc} value={mc}>
                      {t(`products.${mc}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('products.wastagePct')}>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.wastagePct ?? ''}
                  onChange={(e) => set('wastagePct', e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label={t('products.hallmarkNo')}>
                <input
                  className="input"
                  value={form.hallmarkNo ?? ''}
                  onChange={(e) => set('hallmarkNo', e.target.value || null)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isRateBased}
                onChange={(e) => set('isRateBased', e.target.checked)}
              />
              {t('products.isRateBased')}
            </label>
          </>
        ) : (
          <Field label={t('products.sku')}>
            <input
              className="input"
              value={form.sku ?? ''}
              onChange={(e) => set('sku', e.target.value || null)}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('products.costPrice')}>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.costPrice}
              onChange={(e) => set('costPrice', Number(e.target.value))}
            />
          </Field>
          <Field label={t('products.sellingPrice')}>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.sellingPrice}
              onChange={(e) => set('sellingPrice', Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label={t('products.supplier')}>
          <div className="flex gap-2">
            <select
              className="input"
              value={form.supplierId ?? ''}
              onChange={(e) => set('supplierId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('products.noSupplier')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreatingSupplier(true)}
              className="btn-secondary shrink-0 px-3"
              title={t('suppliers.newSupplier')}
            >
              +
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('products.stockQty')}>
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.stockQty}
              onChange={(e) => set('stockQty', Number(e.target.value))}
            />
          </Field>
          <Field label={t('products.lowStockThreshold')}>
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.lowStockThreshold}
              onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {t('products.save')}
          </button>
        </div>
      </form>

      {categoryModal && (
        <CategoryFormModal
          existing={
            categoryModal === 'edit' ? categories.find((c) => c.id === form.categoryId) : undefined
          }
          onClose={() => setCategoryModal(null)}
          onSaved={(category) => {
            setCategories((prev) =>
              [...prev.filter((c) => c.id !== category.id), category].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            )
            set('categoryId', category.id)
            setCategoryModal(null)
          }}
        />
      )}

      {creatingSupplier && (
        <SupplierFormModal
          onClose={() => setCreatingSupplier(false)}
          onSaved={(supplier) => {
            setSuppliers((prev) => [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name)))
            set('supplierId', supplier.id)
            setCreatingSupplier(false)
          }}
        />
      )}
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}
