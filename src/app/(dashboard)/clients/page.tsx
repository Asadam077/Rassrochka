'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Client } from '@/types'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { ClientForm } from '@/components/clients/ClientForm'
import { Search, Plus, X } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [investors, setInvestors] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const res = await fetch(`/api/clients?${params}`)
    const data = await res.json()
    setClients(data)
    setLoading(false)
  }, [search, status])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetch('/api/investors').then(r => r.json()).then(data => {
      setInvestors(data.map((inv: { id: string; name: string }) => ({ id: inv.id, name: inv.name })))
    })
  }, [])

  const statusBadge = (status: string) => {
    const classes = {
      ACTIVE: 'badge-active',
      CLOSED: 'badge-closed',
      OVERDUE: 'badge-overdue',
    }[status] || 'badge-closed'
    return <span className={classes}>{getStatusLabel(status)}</span>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Клиенты</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{clients.length} клиентов</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Новый клиент
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Новый клиент</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <X size={18} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
          <ClientForm investors={investors} onSuccess={() => { setShowForm(false); fetchClients() }} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, товару..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">Все статусы</option>
          <option value="ACTIVE">Активные</option>
          <option value="CLOSED">Закрытые</option>
          <option value="OVERDUE">Просроченные</option>
        </select>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Загрузка...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Клиенты не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Клиент', 'Товар', 'Сумма', 'Остаток', 'Ежемесячно', 'Статус', 'Следующий платёж'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        <p className="text-sm font-medium text-[var(--foreground)]">{client.fullName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{client.phone}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)] max-w-[200px] truncate">{client.productName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(client.salePrice)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)]">{formatCurrency(client.remainingDebt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)]">{formatCurrency(client.monthlyPayment)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(client.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)]">{formatDate(client.nextPaymentDate)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
