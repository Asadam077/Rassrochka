import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')

  const where: Record<string, unknown> = { companyId: session.user.companyId }
  if (clientId) where.clientId = clientId

  const payments = await prisma.payment.findMany({
    where,
    include: {
      client: { select: { id: true, fullName: true, productName: true } },
    },
    orderBy: { paymentDate: 'desc' },
    take: 100,
  })

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { clientId, amount, type, paymentDate, notes } = body

  // Get client to update remaining debt
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: session.user.companyId },
  })

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const payment = await prisma.payment.create({
    data: {
      clientId,
      companyId: session.user.companyId,
      amount,
      type,
      paymentDate: new Date(paymentDate),
      notes,
    },
  })

  // Update client remaining debt and status
  const newRemainingDebt = Math.max(0, client.remainingDebt - amount)
  const newStatus = newRemainingDebt === 0 ? 'CLOSED' : client.status
  const newNextPaymentDate = addMonths(new Date(client.nextPaymentDate), 1)

  await prisma.client.update({
    where: { id: clientId },
    data: {
      remainingDebt: newRemainingDebt,
      status: newStatus as 'ACTIVE' | 'CLOSED' | 'OVERDUE',
      nextPaymentDate: newRemainingDebt > 0 ? newNextPaymentDate : client.nextPaymentDate,
    },
  })

  return NextResponse.json(payment, { status: 201 })
}
