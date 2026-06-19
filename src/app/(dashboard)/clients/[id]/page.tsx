'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Client } from '@/types'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { PaymentHistory } from '@/components/clients/PaymentHistory'
import { ArrowLeft, Phone, Package, Calendar, TrendingUp } from 'lucide-react'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClient = async () => {
    const res = await fetch(`/api/clients/${params.id}`)
    const data = await res.json()
    setClient(data)
    setLoading(false)
  }

  useEffect(() => { fetchClient() }, [params.id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-[var(--muted)] rounded animate-pulse w-32" />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 animate-pulse space-y-3">
          <div className="h-6 bg-[var(--muted)] rounded w-1/2" />
          <div className="h-4 bg-[var(--muted)] rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!client) {
    return <div className="text-center py-12 text-[var(--muted-foreground)]">Клиент не найден</div>
  }

  const statusClasses = {
    ACTIVE: 'badge-active',
    CLOSED: 'badge-closed',
    OVERDUE: 'badge-overdue',
  }[client.status] || 'badge-closed'

  const paidAmount = (client.payments || []).reduce((sum, p) => sum + p.amount, 0)
  const progress = client.salePrice > 0 ? Math.min(100, ((paidAmount + client.downPayment) / client.salePrice) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Назад к клиентам
      </button>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-[var(--foreground)]">{client.fullName}</h1>
              <span className={statusClasses}>{getStatusLabel(client.status)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
              <Phone size={14} />
              <span>{client.phone}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(client.remainingDebt)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Остаток долга</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
            <span>Оплачено {progress.toFixed(0)}%</span>
            <span>{formatCurrency(paidAmount + client.downPayment)} из {formatCurrency(client.salePrice)}</span>
          </div>
          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Товар</h2>
          </div>
          <p className="text-base font-medium text-[var(--foreground)] mb-3">{client.productName}</p>
          <div className="space-y-2">
            {[
              { label: 'Себестоимость', value: formatCurrency(client.costPrice) },
              { label: 'Цена продажи', value: formatCurrency(client.salePrice) },
              { label: 'Первоначальный взнос', value: formatCurrency(client.downPayment) },
              { label: 'Ежемесячный платёж', value: formatCurrency(client.monthlyPayment) },
              { label: 'Срок', value: `${client.installmentMonths} месяцев` },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted-foreground)]">{item.label}</span>
                <span className="font-medium text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Финансы</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400">Прибыль</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(client.totalProfit)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{client.profitPercent.toFixed(1)}% доходность</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Дата начала', value: formatDate(client.startDate) },
                { label: 'Следующий платёж', value: formatDate(client.nextPaymentDate) },
                { label: 'Инвестор', value: client.investor?.name || 'Не назначен' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-sm py-1 border-b border-[var(--border)] last:border-0">
                  <span className="text-[var(--muted-foreground)]">{item.label}</span>
                  <span className="font-medium text-[var(--foreground)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <PaymentHistory
          payments={client.payments || []}
          clientId={client.id}
          onPaymentAdded={fetchClient}
        />
      </div>
    </div>
  )
}
