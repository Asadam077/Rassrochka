import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { TrendingUp, Users, Shield, BarChart3, Bell, Zap, CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Управление клиентами',
    description: 'Полная история каждого клиента, платёжи, статусы и уведомления в одном месте.',
  },
  {
    icon: TrendingUp,
    title: 'Инвесторский портал',
    description: 'Прозрачный учёт капитала, прибыли и доходности для каждого инвестора.',
  },
  {
    icon: BarChart3,
    title: 'Аналитика и прогнозы',
    description: 'Детальные отчёты, тренды и прогнозирование оборота на основе реальных данных.',
  },
  {
    icon: Bell,
    title: 'Умные уведомления',
    description: 'Автоматические напоминания о просрочках и предстоящих платежах.',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description: 'Многоуровневая система ролей: администраторы, сотрудники, инвесторы.',
  },
  {
    icon: Zap,
    title: 'Автоматический расчёт',
    description: 'Ежемесячные платежи, прибыль, доходность — всё считается автоматически.',
  },
]

const plans = [
  {
    name: 'Стартер',
    price: 'Бесплатно',
    description: 'Для малого бизнеса',
    features: ['До 50 клиентов', '1 пользователь', 'Базовая аналитика'],
    highlighted: false,
  },
  {
    name: 'Бизнес',
    price: '99 000 сум/мес',
    description: 'Для растущего бизнеса',
    features: ['Безлимит клиентов', 'До 10 пользователей', 'Инвесторский портал', 'Расширенная аналитика', 'Приоритетная поддержка'],
    highlighted: true,
  },
  {
    name: 'Корпоратив',
    price: 'По запросу',
    description: 'Для крупного бизнеса',
    features: ['Всё из Бизнес', 'Безлимит пользователей', 'API интеграция', 'Выделенный менеджер', 'SLA гарантия'],
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="sticky top-0 z-50 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Войти</Link>
            <Link href="/login" className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Начать →</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] border border-[var(--border)] rounded-full text-xs text-[var(--muted-foreground)] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Платформа доступна прямо сейчас
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-tight mb-6">
          CRM для продаж
          <br />
          <span className="text-[var(--muted-foreground)] font-light">в рассрочку</span>
        </h1>
        <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
          dArch.capital — профессиональная платформа для управления рассрочками, клиентами и инвесторами.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Начать бесплатно <ArrowRight size={16} />
          </Link>
          <a href="#features" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-xl text-sm font-semibold hover:bg-[var(--accent)] transition-colors">Узнать больше</a>
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16 pt-16 border-t border-[var(--border)]">
          {[
            { value: '10,000+', label: 'Клиентов управляется' },
            { value: '99.9%', label: 'Время доступности' },
            { value: '3 мин', label: 'Время настройки' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{stat.value}</p>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[var(--accent)] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">Всё что нужно для рассрочки</h2>
            <p className="text-[var(--muted-foreground)]">Полный набор инструментов для вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(feature => (
              <div key={feature.title} className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-[var(--foreground)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">{feature.title}</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">Прозрачные тарифы</h2>
            <p className="text-[var(--muted-foreground)]">Выберите подходящий план</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-xl p-5 border ${
                plan.highlighted ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]'
              }`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.highlighted ? 'opacity-70' : 'text-[var(--muted-foreground)]'}`}>{plan.name}</p>
                <p className="text-2xl font-bold mb-1">{plan.price}</p>
                <p className={`text-xs mb-5 ${plan.highlighted ? 'opacity-70' : 'text-[var(--muted-foreground)]'}`}>{plan.description}</p>
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className={plan.highlighted ? 'opacity-80' : 'text-green-500'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`mt-5 block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-opacity hover:opacity-90 ${
                  plan.highlighted ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                }`}>Выбрать</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--accent)] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">Готовы начать?</h2>
          <p className="text-[var(--muted-foreground)] mb-6 text-sm">Начните управлять рассрочками профессионально уже сегодня.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Войти в систему <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-[var(--muted-foreground)]">© {new Date().getFullYear()} dArch.capital — Все права защищены</p>
        </div>
      </footer>
    </div>
  )
}
