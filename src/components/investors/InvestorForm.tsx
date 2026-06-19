'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InvestorFormProps {
  onSuccess?: () => void
}

export function InvestorForm({ onSuccess }: InvestorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    totalCapital: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalCapital: parseFloat(form.totalCapital) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }

      if (onSuccess) onSuccess()
      else { router.push('/investors'); router.refresh() }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all'
  const labelClass = 'block text-xs font-medium text-[var(--muted-foreground)] mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>Имя инвестора *</label>
        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иванов Иван" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="investor@example.com" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Пароль *</label>
        <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Минимум 8 символов" minLength={8} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Начальный капитал (сум)</label>
        <input type="number" min="0" value={form.totalCapital} onChange={e => setForm(f => ({ ...f, totalCapital: e.target.value }))} placeholder="100 000 000" className={inputClass} />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? 'Создание...' : 'Добавить инвестора'}
      </button>
    </form>
  )
}
