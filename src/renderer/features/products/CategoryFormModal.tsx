import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import type { Category } from '@shared/types/product'

const APPLIES_TO: Category['appliesTo'][] = ['both', 'jewelry', 'gift']

export function CategoryFormModal({
  existing,
  onClose,
  onSaved
}: {
  existing?: Category
  onClose: () => void
  onSaved: (category: Category) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(existing?.name ?? '')
  const [appliesTo, setAppliesTo] = useState<Category['appliesTo']>(existing?.appliesTo ?? 'both')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const category = existing
        ? await window.api.categories.update({ id: existing.id, name, appliesTo })
        : await window.api.categories.create({ name, appliesTo })
      onSaved(category)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={existing ? t('products.editCategory') : t('products.newCategory')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('products.categoryName')}
          <input
            autoFocus
            required
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('products.categoryAppliesTo')}
          <select
            className="input mt-1"
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as Category['appliesTo'])}
          >
            {APPLIES_TO.map((value) => (
              <option key={value} value={value}>
                {t(`products.appliesTo_${value}`)}
              </option>
            ))}
          </select>
        </label>
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
    </Modal>
  )
}
