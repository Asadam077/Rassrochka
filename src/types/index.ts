export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'INVESTOR'
export type ClientStatus = 'ACTIVE' | 'CLOSED' | 'OVERDUE'
export type PaymentType = 'PARTIAL' | 'FULL' | 'MONTHLY'
export type NotificationType = 'PAYMENT_DUE' | 'OVERDUE' | 'NEW_CLIENT'

export interface Company {
  id: string
  name: string
  slug: string
  plan: string
  createdAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  companyId: string
  createdAt: Date
}

export interface Investor {
  id: string
  userId: string
  companyId: string
  name: string
  totalCapital: number
  activeCapital: number
  freeCapital: number
  totalProfit: number
  createdAt: Date
  user?: User
  clients?: Client[]
}

export interface Client {
  id: string
  companyId: string
  investorId?: string
  employeeId?: string
  fullName: string
  phone: string
  productName: string
  costPrice: number
  salePrice: number
  downPayment: number
  installmentMonths: number
  monthlyPayment: number
  totalProfit: number
  profitPercent: number
  remainingDebt: number
  status: ClientStatus
  startDate: Date
  nextPaymentDate: Date
  createdAt: Date
  investor?: Investor
  employee?: User
  payments?: Payment[]
}

export interface Payment {
  id: string
  clientId: string
  companyId: string
  amount: number
  type: PaymentType
  paymentDate: Date
  notes?: string
  createdAt: Date
  client?: Client
}

export interface Notification {
  id: string
  companyId: string
  userId?: string
  type: NotificationType
  message: string
  isRead: boolean
  clientId?: string
  createdAt: Date
}

export interface DashboardStats {
  totalTurnover: number
  totalInvestedCapital: number
  totalProfit: number
  activeClientsCount: number
  closedClientsCount: number
  overdueCount: number
  averageYield: number
  forecastTurnover: number
  forecastProfit: number
}

export interface ChartDataPoint {
  month: string
  value: number
  profit?: number
  clients?: number
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  companyId: string
}
