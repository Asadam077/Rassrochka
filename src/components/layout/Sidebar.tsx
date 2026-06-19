'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  UserCheck,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react'
import { Logo } from './Logo'
import { cn, getRoleLabel } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  overdueCount?: number
}

const navigation = [
  { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Клиенты', href: '/clients', icon: Users },
  { name: 'Платежи', href: '/payments', icon: CreditCard },
  { name: 'Просрочки', href: '/overdue', icon: AlertTriangle, badge: true },
  { name: 'Инвесторы', href: '/investors', icon: TrendingUp },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Сотрудники', href: '/employees', icon: UserCheck },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose, overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                )}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge && overdueCount > 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold',
                    isActive ? 'bg-red-400 text-white' : 'bg-red-100 text-red-700'
                  )}>
                    {overdueCount > 99 ? '99+' : overdueCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="shrink-0 opacity-60" />}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Администрирование
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                    )}
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight size={14} className="shrink-0 ml-auto opacity-60" />}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--accent)]">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-semibold shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {session?.user?.name || 'Пользователь'}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {getRoleLabel(session?.user?.role || '')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
