'use client'

import { useSession } from 'next-auth/react'
import { getRoleLabel } from '@/lib/utils'
import { Shield, User, Building2 } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Настройки</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Управление аккаунтом и настройки компании</p>
      </div>

      {/* Profile section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Профиль</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xl font-bold">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--foreground)]">{session?.user?.name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{session?.user?.email}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">Роль:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{getRoleLabel(session?.user?.role || '')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Компания</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">ID компании</span>
            <span className="text-sm font-mono text-[var(--foreground)]">{session?.user?.companyId?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">Валюта</span>
            <span className="text-sm font-medium text-[var(--foreground)]">UZS (Узбекский сум)</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[var(--muted-foreground)]">Платформа</span>
            <span className="text-sm font-medium text-[var(--foreground)]">dArch.capital</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[var(--card)] border border-red-200 dark:border-red-900 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-600 mb-3">Зона опасности</h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Эти действия необратимы. Будьте осторожны.
        </p>
        <button
          className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          onClick={() => alert('Для удаления аккаунта обратитесь к администратору.')}
        >
          Удалить аккаунт
        </button>
      </div>
    </div>
  )
}
