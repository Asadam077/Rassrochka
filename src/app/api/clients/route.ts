import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const investorId = searchParams.get('investorId')

  const where: Record<string, unknown> = { companyId: session.user.companyId }
  if (status) where.status = status
  if (investorId) where.investorId = investorId
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { productName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      investor: true,
      employee: { select: { id: true, name: true, email: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    fullName, phone, productName, costPrice, salePrice,
    downPayment, installmentMonths, investorId, startDate,
  } = body

  const monthlyPayment = (salePrice - downPayment) / installmentMonths
  const totalProfit = salePrice - costPrice
  const profitPercent = ((salePrice - costPrice) / costPrice) * 100
  const remainingDebt = salePrice - downPayment
  const start = new Date(startDate)
  const nextPaymentDate = addMonths(start, 1)

  const client = await prisma.client.create({
    data: {
      companyId: session.user.companyId,
      employeeId: session.user.id,
      investorId: investorId || null,
      fullName,
      phone,
      productName,
      costPrice,
      salePrice,
      downPayment,
      installmentMonths,
      monthlyPayment,
      totalProfit,
      profitPercent,
      remainingDebt,
      startDate: start,
      nextPaymentDate,
    },
  })

  return NextResponse.json(client, { status: 201 })
}
