'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateMonthlyPayment, calculateProfitPercent, calculateTotalProfit, formatCurrency } from '@/lib/utils'

interface ClientFormProps {
  investors?: { id: string; name: string }[]
  onSuccess?: () => void
}

export function ClientForm({ investors = [], onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    productName: '',
    costPrice: '',
    salePrice: '',
    downPayment: '0',
    installmentMonths: '12',
    investorId: '',
    startDate: new Date().toISOString().split('T')[0],
  })

  const [calculated, setCalculated] = useState({
    monthlyPayment: 0,
    totalProfit: 0,
    profitPercent: 0,
  })

  useEffect(() => {
    const cost = parseFloat(form.costPrice) || 0
    const sale = parseFloat(form.salePrice) || 0
    const down = parseFloat(form.downPayment) || 0
    const months = parseInt(form.installmentMonths) || 1
    if (sale > 0 && months > 0) {
      setCalculated({
        monthlyPayment: calculateMonthlyPayment(sale, down, months),
        totalProfit: cost > 0 ? calculateTotalProfit(cost, sale) : 0,
        profitPercent: cost > 0 ? calculateProfitPercent(cost, sale) : 0,
      })
    }
  }, [form.costPrice, form.salePrice, form.downPayment, form.installmentMonths])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          costPrice: parseFloat(form.costPrice),
          salePrice: parseFloat(form.salePrice),
          downPayment: parseFloat(form.downPayment) || 0,
          installmentMonths: parseInt(form.installmentMonths),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при создании клиента')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/clients')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all'
  const labelClass = 'block text-xs font-medium text-[var(--muted-foreground)] mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Полное имя *</label>
          <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Иванов Иван Иванович" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Телефон *</label>
          <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Товар *</label>
        <input required value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Холодильник Samsung RF65A96788S" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Себестоимость (сум) *</label>
          <input required type="number" min="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="5 000 000" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Цена продажи (сум) *</label>
          <input required type="number" min="0" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="7 000 000" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Первоначальный взнос (сум)</label>
          <input type="number" min="0" value={form.downPayment} onChange={e => setForm(f => ({ ...f, downPayment: e.target.value }))} placeholder="0" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Срок рассрочки (месяцев) *</label>
          <select required value={form.installmentMonths} onChange={e => setForm(f => ({ ...f, installmentMonths: e.target.value }))} className={inputClass}>
            {[3, 6, 9, 12, 18, 24, 36].map(m => (
              <option key={m} value={m}>{m} месяцев</option>
            ))}
          </select>
        </div>
      </div>

      {(calculated.monthlyPayment > 0 || calculated.totalProfit > 0) && (
        <div className="p-4 bg-[var(--accent)] rounded-lg space-y-2">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Расчёт</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Ежемесячный платёж</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(calculated.monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Прибыль</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(calculated.totalProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Доходность</p>
              <p className="text-sm font-semibold text-green-600">{calculated.profitPercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Инвестор</label>
          <select value={form.investorId} onChange={e => setForm(f => ({ ...f, investorId: e.target.value }))} className={inputClass}>
            <option value="">Не назначен</option>
            {investors.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Дата начала *</label>
          <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? 'Создание...' : 'Создать клиента'}
      </button>
    </form>
  )
}
