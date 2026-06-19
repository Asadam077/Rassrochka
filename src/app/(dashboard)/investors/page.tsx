'use client'

import { useEffect, useState } from 'react'
import { Investor } from '@/types'
import { InvestorCard } from '@/components/investors/InvestorCard'
import { InvestorForm } from '@/components/investors/InvestorForm'
import { useSession } from 'next-auth/react'
import { Plus, X } from 'lucide-react'

export default function InvestorsPage() {
  const { data: session } = useSession()
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  const fetchInvestors = async () => {
    const res = await fetch('/api/investors')
    const data = await res.json()
    setInvestors(data)
    setLoading(false)
  }

  useEffect(() => { fetchInvestors() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Инвесторы</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{investors.length} инвесторов</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Добавить инвестора
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Новый инвестор</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[var(--muted)] rounded-lg">
              <X size={18} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
          <InvestorForm onSuccess={() => { setShowForm(false); fetchInvestors() }} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : investors.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-xl">
          <p className="text-sm text-[var(--muted-foreground)]">Инвесторы не добавлены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investors.map(investor => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      )}
    </div>
  )
}
