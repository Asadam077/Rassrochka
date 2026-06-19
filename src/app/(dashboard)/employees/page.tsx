'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getRoleLabel, formatDate } from '@/lib/utils'
import { Plus, X, UserCheck } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count?: { clients: number }
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' })

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(data)
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      setForm({ name: '', email: '', password: '', role: 'EMPLOYEE' })
      setShowForm(false)
      fetchEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all'
  const labelClass = 'block text-xs font-medium text-[var(--muted-foreground)] mb-1.5'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Сотрудники</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{employees.length} сотрудников</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Добавить сотрудника
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Новый сотрудник</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[var(--muted)] rounded-lg">
              <X size={18} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Имя *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иванов Иван" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ivan@company.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Пароль *</label>
                <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Мин. 8 символов" minLength={8} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Роль</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="EMPLOYEE">Сотрудник</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={formLoading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {formLoading ? 'Добавление...' : 'Добавить сотрудника'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Загрузка...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck size={32} className="mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">Сотрудники не добавлены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Сотрудник', 'Email', 'Роль', 'Клиентов', 'Дата добавления'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-semibold">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-[var(--accent)] rounded-full text-[var(--muted-foreground)]">
                        {getRoleLabel(emp.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{emp._count?.clients || 0}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{formatDate(emp.createdAt)}</td>
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
