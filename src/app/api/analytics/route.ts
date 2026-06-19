import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { linearForecast } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = session.user.companyId

  // Get last 6 months data
  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    months.push({
      label: format(date, 'MMM'),
      start: startOfMonth(date),
      end: endOfMonth(date),
    })
  }

  const monthlyData = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const [payments, newClients, activeClients] = await Promise.all([
        prisma.payment.aggregate({
          where: { companyId, paymentDate: { gte: start, lte: end } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.client.count({
          where: { companyId, createdAt: { gte: start, lte: end } },
        }),
        prisma.client.count({
          where: { companyId, status: 'ACTIVE', createdAt: { lte: end } },
        }),
      ])

      return {
        month: label,
        amount: payments._sum.amount || 0,
        count: payments._count,
        new: newClients,
        active: activeClients,
        closed: 0,
      }
    })
  )

  const revenueValues = monthlyData.map(d => d.amount)
  const forecastValue = linearForecast(revenueValues)

  // Overall stats
  const [totalClients, activeClients, closedClients, overdueClients, totalPayments, investors] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.client.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.client.count({ where: { companyId, status: 'CLOSED' } }),
    prisma.client.count({ where: { companyId, status: 'OVERDUE' } }),
    prisma.payment.aggregate({
      where: { companyId },
      _sum: { amount: true },
    }),
    prisma.investor.findMany({
      where: { companyId },
      select: { totalCapital: true, activeCapital: true, totalProfit: true },
    }),
  ])

  const totalInvestedCapital = investors.reduce((sum, inv) => sum + inv.totalCapital, 0)
  const totalActiveCapital = investors.reduce((sum, inv) => sum + inv.activeCapital, 0)
  const totalProfit = investors.reduce((sum, inv) => sum + inv.totalProfit, 0)
  const totalTurnover = totalPayments._sum.amount || 0
  const averageYield = totalInvestedCapital > 0 ? (totalProfit / totalInvestedCapital) * 100 : 0

  return NextResponse.json({
    stats: {
      totalTurnover,
      totalInvestedCapital,
      totalProfit,
      activeClientsCount: activeClients,
      closedClientsCount: closedClients,
      overdueCount: overdueClients,
      averageYield,
      forecastTurnover: forecastValue,
      forecastProfit: forecastValue * (averageYield / 100),
    },
    monthlyData,
  })
}
