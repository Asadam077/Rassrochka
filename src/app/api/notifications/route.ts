import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, isBefore, isAfter } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = session.user.companyId
  const now = new Date()
  const threeDaysLater = addDays(now, 3)

  // Auto-compute notifications from active clients
  const clients = await prisma.client.findMany({
    where: { companyId, status: { in: ['ACTIVE', 'OVERDUE'] } },
    select: { id: true, fullName: true, nextPaymentDate: true, status: true, monthlyPayment: true },
  })

  const notifications = clients
    .map(client => {
      if (isBefore(new Date(client.nextPaymentDate), now)) {
        return {
          id: `overdue-${client.id}`,
          type: 'OVERDUE' as const,
          message: `${client.fullName} — просрочен платёж`,
          clientId: client.id,
          isRead: false,
          createdAt: client.nextPaymentDate,
        }
      } else if (isAfter(new Date(client.nextPaymentDate), now) && isBefore(new Date(client.nextPaymentDate), threeDaysLater)) {
        return {
          id: `due-${client.id}`,
          type: 'PAYMENT_DUE' as const,
          message: `${client.fullName} — платёж через 3 дня`,
          clientId: client.id,
          isRead: false,
          createdAt: client.nextPaymentDate,
        }
      }
      return null
    })
    .filter(Boolean)

  return NextResponse.json(notifications)
}
