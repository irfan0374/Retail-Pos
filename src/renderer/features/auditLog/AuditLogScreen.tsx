import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditLogEntry } from '@shared/types/auditLog'
import type { SafeUser } from '@shared/types/user'

export function AuditLogScreen() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [users, setUsers] = useState<SafeUser[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userId, setUserId] = useState<number | null>(null)

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]))

  useEffect(() => {
    void window.api.reports.usersList().then(setUsers)
  }, [])

  const search = useCallback(async () => {
    setEntries(
      await window.api.auditLog.list({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        userId: userId ?? undefined
      })
    )
  }, [dateFrom, dateTo, userId])

  useEffect(() => {
    void search()
  }, [search])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t('auditLog.title')}</h1>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateFrom')}
          <input type="date" className="input mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateTo')}
          <input type="date" className="input mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('auditLog.user')}
          <select
            className="input mt-1"
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('auditLog.allUsers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('auditLog.timestamp')}</th>
              <th className="px-4 py-2">{t('auditLog.user')}</th>
              <th className="px-4 py-2">{t('auditLog.action')}</th>
              <th className="px-4 py-2">{t('auditLog.table')}</th>
              <th className="px-4 py-2">{t('auditLog.details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 text-slate-500">{e.timestamp}</td>
                <td className="px-4 py-2">{e.userId ? (usersById[e.userId]?.name ?? `#${e.userId}`) : '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-2 text-slate-500">{e.tableName ?? '—'}</td>
                <td className="max-w-xs truncate px-4 py-2 text-xs text-slate-400" title={e.details ?? ''}>
                  {e.details ?? ''}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t('auditLog.noEntries')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
