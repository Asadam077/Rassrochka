'use client'

import { signOut } from 'next-auth/react'
import { Menu, Moon, Sun, Bell, LogOut } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useState } from 'react'

interface HeaderProps {
  onMenuToggle: () => void
  title?: string
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center px-4 gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
      >
        <Menu size={20} />
      </button>

      {title && (
        <h1 className="text-lg font-semibold text-[var(--foreground)] hidden sm:block">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications bell */}
        <button className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors relative">
          <Bell size={18} />
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          title="Выйти"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
