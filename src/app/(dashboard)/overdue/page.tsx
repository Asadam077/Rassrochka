'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Client } from '@/types'
import { formatCurrency, formatDate, isDueSoon, isOverdue } from '@/lib/utils'
import { AlertTriangle, Clock, Phone } from 'lucide-react'

export default function OverduePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/clients?status=OVERDUE').then(r => r.json()),
      fetch('/api/clients?status=ACTIVE').then(r => r.json()),
    ]).then(([overdue, active]) => {
      const dueSoon = active.filter((c: Client) => isDueSoon(c.nextPaymentDate))
      setClients([...overdue, ...dueSoon])
      setLoading(false)
    })
  }, [])

  const overdueClients = clients.filter(c => isOverdue(c.nextPaymentDate))
  const dueSoonClients = clients.filter(c => !isOverdue(c.nextPaymentDate) && isDueSoon(c.nextPaymentDate))

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Просрочки</h1>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[var(--card)] border border-[var(--border)] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Просрочки и должники</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {overdueClients.length} просрочено · {dueSoonClients.length} оплата в течение 3 дней
        </p>
      </div>

      {overdueClients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Просроченные ({overdueClients.length})</h2>
          </div>
          <div className="space-y-2">
            {overdueClients.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400 text-sm font-bold">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{client.fullName}</p>
                        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <Phone size={10} />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 ml-12">{client.productName}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-red-600">{formatCurrency(client.monthlyPayment)}</p>
                    <p className="text-xs text-red-500">Должен был: {formatDate(client.nextPaymentDate)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Долг: {formatCurrency(client.remainingDebt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {dueSoonClients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-600">Скоро оплата ({dueSoonClients.length})</h2>
          </div>
          <div className="space-y-2">
            {dueSoonClients.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{client.fullName}</p>
                        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <Phone size={10} />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 ml-12">{client.productName}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(client.monthlyPayment)}</p>
                    <p className="text-xs text-amber-500">Дата: {formatDate(client.nextPaymentDate)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Долг: {formatCurrency(client.remainingDebt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="text-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-xl">
          <p className="text-base font-medium text-[var(--foreground)]">Всё чисто!</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Нет просрочек и приближающихся платежей</p>
        </div>
      )}
    </div>
  )
}
