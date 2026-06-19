import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, isBefore, addDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'UZS'): string {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('uz-UZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' сум'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd.MM.yyyy')
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), 'dd MMMM yyyy')
}

export function isOverdue(nextPaymentDate: Date | string): boolean {
  return isBefore(new Date(nextPaymentDate), new Date())
}

export function isDueSoon(nextPaymentDate: Date | string, days = 3): boolean {
  const date = new Date(nextPaymentDate)
  return isAfter(date, new Date()) && isBefore(date, addDays(new Date(), days))
}

export function calculateMonthlyPayment(
  salePrice: number,
  downPayment: number,
  installmentMonths: number
): number {
  return (salePrice - downPayment) / installmentMonths
}

export function calculateProfitPercent(costPrice: number, salePrice: number): number {
  return ((salePrice - costPrice) / costPrice) * 100
}

export function calculateTotalProfit(costPrice: number, salePrice: number): number {
  return salePrice - costPrice
}

export function linearForecast(data: number[]): number {
  if (data.length < 2) return data[0] || 0
  const n = data.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumX2 += i * i
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return Math.max(0, slope * n + intercept)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
    case 'CLOSED':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    case 'OVERDUE':
      return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Активный'
    case 'CLOSED': return 'Закрыт'
    case 'OVERDUE': return 'Просрочен'
    default: return status
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'Супер Администратор'
    case 'ADMIN': return 'Администратор'
    case 'EMPLOYEE': return 'Сотрудник'
    case 'INVESTOR': return 'Инвестор'
    default: return role
  }
}
