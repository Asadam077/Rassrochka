import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const investors = await prisma.investor.findMany({
    where: { companyId: session.user.companyId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { clients: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(investors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, email, password, totalCapital } = body

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'INVESTOR',
      companyId: session.user.companyId,
    },
  })

  const investor = await prisma.investor.create({
    data: {
      userId: user.id,
      companyId: session.user.companyId,
      name,
      totalCapital: totalCapital || 0,
      activeCapital: 0,
      freeCapital: totalCapital || 0,
      totalProfit: 0,
    },
  })

  return NextResponse.json(investor, { status: 201 })
}
