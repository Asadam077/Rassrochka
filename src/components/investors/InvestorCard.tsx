import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Investor } from '@/types'
import { TrendingUp, Users } from 'lucide-react'

interface InvestorCardProps {
  investor: Investor & { _count?: { clients: number } }
}

export function InvestorCard({ investor }: InvestorCardProps) {
  return (
    <Link href={`/investors/${investor.id}`}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-all hover:border-[var(--ring)] cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-bold mb-2">
              {investor.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{investor.name}</h3>
            {investor.user?.email && (
              <p className="text-xs text-[var(--muted-foreground)]">{investor.user.email}</p>
            )}
          </div>
          {investor._count && (
            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Users size={14} />
              <span>{investor._count.clients} клиентов</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--muted-foreground)]">Общий капитал</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(investor.totalCapital)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--muted-foreground)]">Активный</span>
            <span className="text-sm font-medium text-amber-600">{formatCurrency(investor.activeCapital)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--muted-foreground)]">Свободный</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(investor.freeCapital)}</span>
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <TrendingUp size={12} />
                <span>Прибыль</span>
              </div>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(investor.totalProfit)}</span>
            </div>
            {investor.totalCapital > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                  <span>Загруженность</span>
                  <span>{((investor.activeCapital / investor.totalCapital) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: `${Math.min(100, (investor.activeCapital / investor.totalCapital) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
