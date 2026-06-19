'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { ArrowLeft, TrendingUp } from 'lucide-react'

interface InvestorDetail {
  id: string
  name: string
  totalCapital: number
  activeCapital: number
  freeCapital: number
  totalProfit: number
  user: { email: string; name: string }
  clients: Array<{
    id: string
    fullName: string
    phone: string
    productName: string
    salePrice: number
    remainingDebt: number
    monthlyPayment: number
    status: string
    nextPaymentDate: string
  }>
}

export default function InvestorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [investor, setInvestor] = useState<InvestorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients?investorId=${params.id}`)
      .then(r => r.json())
      .then(clients => {
        fetch('/api/investors')
          .then(r => r.json())
          .then(investors => {
            const inv = investors.find((i: { id: string }) => i.id === params.id)
            if (inv) setInvestor({ ...inv, clients })
            setLoading(false)
          })
      })
  }, [params.id])

  if (loading) return <div className="text-center py-12 text-[var(--muted-foreground)]">Загрузка...</div>
  if (!investor) return <div className="text-center py-12 text-[var(--muted-foreground)]">Инвестор не найден</div>

  const activeClients = investor.clients.filter(c => c.status === 'ACTIVE')
  const closedClients = investor.clients.filter(c => c.status === 'CLOSED')

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Назад
      </button>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-lg font-bold">
            {investor.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--foreground)]">{investor.name}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{investor.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[var(--border)]">
          {[
            { label: 'Общий капитал', value: formatCurrency(investor.totalCapital), color: 'text-[var(--foreground)]' },
            { label: 'Активный', value: formatCurrency(investor.activeCapital), color: 'text-amber-600' },
            { label: 'Свободный', value: formatCurrency(investor.freeCapital), color: 'text-green-600' },
            { label: 'Прибыль', value: formatCurrency(investor.totalProfit), color: 'text-green-600' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
              <p className={`text-base font-bold ${item.color} mt-0.5`}>{item.value}</p>
            </div>
          ))}
        </div>

        {investor.totalCapital > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
              <span>Загруженность капитала</span>
              <span>{((investor.activeCapital / investor.totalCapital) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-[var(--muted)] rounded-full">
              <div
                className="h-full bg-[var(--primary)] rounded-full"
                style={{ width: `${Math.min(100, (investor.activeCapital / investor.totalCapital) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Клиенты ({investor.clients.length}) · Активных: {activeClients.length} · Закрытых: {closedClients.length}
          </h2>
        </div>
        {investor.clients.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Клиентов нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Клиент', 'Товар', 'Сумма', 'Остаток', 'Статус', 'Платёж'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {investor.clients.map(client => (
                  <tr key={client.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        <p className="text-sm font-medium text-[var(--foreground)]">{client.fullName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{client.phone}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)] max-w-[180px] truncate">{client.productName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{formatCurrency(client.salePrice)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{formatCurrency(client.remainingDebt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        client.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                        client.status === 'OVERDUE' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{formatDate(client.nextPaymentDate)}</p>
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
