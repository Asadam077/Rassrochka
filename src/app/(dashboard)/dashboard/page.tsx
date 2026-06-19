'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { PaymentsChart } from '@/components/dashboard/PaymentsChart'
import { ClientsChart } from '@/components/dashboard/ClientsChart'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Percent,
  BarChart3,
  Target,
} from 'lucide-react'

interface DashboardData {
  stats: {
    totalTurnover: number
    totalInvestedCapital: number
    totalProfit: number
    activeClientsCount: number
    closedClientsCount: number
    overdueCount: number
    averageYield: number
    forecastTurnover: number
    forecastProfit: number
  }
  monthlyData: {
    month: string
    amount: number
    count: number
    new: number
    active: number
    closed: number
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Дашборд</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Обзор вашего бизнеса</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-[var(--muted)] rounded w-2/3 mb-3" />
              <div className="h-7 bg-[var(--muted)] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const monthlyData = data?.monthlyData || []

  const revenueChartData = monthlyData.map(d => ({ month: d.month, value: d.amount }))
  const paymentsChartData = monthlyData.map(d => ({ month: d.month, amount: d.amount, count: d.count }))
  const clientsChartData = monthlyData.map(d => ({ month: d.month, active: d.active, new: d.new, closed: d.closed }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Дашборд</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Обзор вашего бизнеса</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Общий оборот"
          value={formatCurrency(stats?.totalTurnover || 0)}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="Инвестированный капитал"
          value={formatCurrency(stats?.totalInvestedCapital || 0)}
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="Общая прибыль"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={BarChart3}
          variant="success"
        />
        <StatsCard
          title="Доходность"
          value={`${(stats?.averageYield || 0).toFixed(1)}%`}
          icon={Percent}
          variant="success"
        />
        <StatsCard
          title="Активные клиенты"
          value={stats?.activeClientsCount || 0}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Закрытые клиенты"
          value={stats?.closedClientsCount || 0}
          icon={CheckCircle}
          variant="default"
        />
        <StatsCard
          title="Просрочки"
          value={stats?.overdueCount || 0}
          icon={AlertTriangle}
          variant={stats?.overdueCount ? 'danger' : 'default'}
        />
        <StatsCard
          title="Прогноз оборота"
          value={formatCurrency(stats?.forecastTurnover || 0)}
          subtitle="Следующий месяц"
          icon={Target}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueChartData} />
        <PaymentsChart data={paymentsChartData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClientsChart data={clientsChartData} />

        {/* Quick summary card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Финансовый обзор</h3>
          <div className="space-y-3">
            {[
              { label: 'Прогноз оборота', value: formatCurrency(stats?.forecastTurnover || 0), color: 'text-[var(--foreground)]' },
              { label: 'Прогноз прибыли', value: formatCurrency(stats?.forecastProfit || 0), color: 'text-green-600' },
              { label: 'Средняя доходность', value: `${(stats?.averageYield || 0).toFixed(2)}%`, color: 'text-green-600' },
              { label: 'Просрочки', value: `${stats?.overdueCount || 0} клиентов`, color: (stats?.overdueCount || 0) > 0 ? 'text-red-600' : 'text-[var(--muted-foreground)]' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--muted-foreground)]">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
