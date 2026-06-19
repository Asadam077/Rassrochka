'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

interface AnalyticsData {
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

const CHART_COLORS = ['#2D2D2D', '#22C55E', '#F59E0B', '#EF4444', '#6B6B6B']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Аналитика</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const monthlyData = data?.monthlyData || []
  const stats = data?.stats

  const statusDistribution = [
    { name: 'Активные', value: stats?.activeClientsCount || 0 },
    { name: 'Закрытые', value: stats?.closedClientsCount || 0 },
    { name: 'Просроченные', value: stats?.overdueCount || 0 },
  ]

  const tooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Аналитика</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Детальная аналитика за последние 6 месяцев</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Общий оборот', value: formatCurrency(stats?.totalTurnover || 0) },
          { label: 'Инвестиций', value: formatCurrency(stats?.totalInvestedCapital || 0) },
          { label: 'Прибыль', value: formatCurrency(stats?.totalProfit || 0) },
          { label: 'Доходность', value: `${(stats?.averageYield || 0).toFixed(1)}%` },
        ].map(item => (
          <div key={item.label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Месячный оборот</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D2D2D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2D2D2D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Оборот']} />
              <Area type="monotone" dataKey="amount" stroke="#2D2D2D" strokeWidth={2} fill="url(#gradAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Распределение клиентов</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statusDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-xs text-[var(--muted-foreground)]">{item.name}</span>
                  <span className="text-xs font-semibold text-[var(--foreground)] ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Количество платежей</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Платежей" fill="#2D2D2D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Динамика клиентов</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="new" name="Новые" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" name="Активные" fill="#2D2D2D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Прогноз на следующий месяц</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--accent)] rounded-xl">
            <p className="text-xs text-[var(--muted-foreground)]">Прогноз оборота</p>
            <p className="text-xl font-bold text-[var(--foreground)] mt-1">{formatCurrency(stats?.forecastTurnover || 0)}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-xl">
            <p className="text-xs text-green-600">Прогноз прибыли</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(stats?.forecastProfit || 0)}</p>
          </div>
          <div className="p-4 bg-[var(--accent)] rounded-xl">
            <p className="text-xs text-[var(--muted-foreground)]">Средняя доходность</p>
            <p className="text-xl font-bold text-[var(--foreground)] mt-1">{(stats?.averageYield || 0).toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
