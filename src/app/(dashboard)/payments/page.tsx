'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment } from '@/types'

const typeLabels: Record<string, string> = {
  MONTHLY: 'Ежемесячный',
  PARTIAL: 'Частичный',
  FULL: 'Полное погашение',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { client?: { id: string; fullName: string; productName: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payments')
      .then(r => r.json())
      .then(data => { setPayments(data); setLoading(false) })
  }, [])

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Платежи</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {payments.length} платежей · Итого: {formatCurrency(totalAmount)}
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Загрузка...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">Платежей пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Клиент', 'Товар', 'Сумма', 'Тип', 'Дата', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${payment.client?.id}`} className="text-sm font-medium text-[var(--foreground)] hover:underline">
                        {payment.client?.fullName || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--muted-foreground)] max-w-[200px] truncate">
                        {payment.client?.productName || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-[var(--accent)] rounded-full text-[var(--muted-foreground)]">
                        {typeLabels[payment.type] || payment.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)]">{formatDate(payment.paymentDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {payment.notes && (
                        <p className="text-xs text-[var(--muted-foreground)] max-w-[150px] truncate" title={payment.notes}>
                          {payment.notes}
                        </p>
                      )}
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
