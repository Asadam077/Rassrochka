'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment } from '@/types'
import { Plus } from 'lucide-react'

interface PaymentHistoryProps {
  payments: Payment[]
  clientId: string
  onPaymentAdded?: () => void
}

export function PaymentHistory({ payments, clientId, onPaymentAdded }: PaymentHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    type: 'MONTHLY',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          amount: parseFloat(form.amount),
          type: form.type,
          paymentDate: form.paymentDate,
          notes: form.notes,
        }),
      })
      setForm({ amount: '', type: 'MONTHLY', paymentDate: new Date().toISOString().split('T')[0], notes: '' })
      setShowForm(false)
      onPaymentAdded?.()
    } finally {
      setLoading(false)
    }
  }

  const typeLabels: Record<string, string> = {
    MONTHLY: 'Ежемесячный',
    PARTIAL: 'Частичный',
    FULL: 'Полное погашение',
  }

  const inputClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">История платежей</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Добавить платёж
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-[var(--accent)] rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Сумма</label>
              <input
                required
                type="number"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Тип</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className={inputClass}
              >
                <option value="MONTHLY">Ежемесячный</option>
                <option value="PARTIAL">Частичный</option>
                <option value="FULL">Полное погашение</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Дата</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Примечание</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Опционально"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--accent)] transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {payments.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">Платежей пока нет</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{typeLabels[payment.type]} · {formatDate(payment.paymentDate)}</p>
                {payment.notes && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{payment.notes}</p>}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  Оплачено
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
