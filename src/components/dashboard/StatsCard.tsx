import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const iconColors = {
    default: 'bg-[var(--accent)] text-[var(--foreground)]',
    success: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--foreground)] truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={cn(
              'text-xs font-medium mt-1',
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% за месяц
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg shrink-0 ml-4', iconColors[variant])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
