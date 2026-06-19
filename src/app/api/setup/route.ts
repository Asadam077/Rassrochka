import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SECRET = process.env.SETUP_SECRET || 'darch-setup-2024'

export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({}))
  if (secret !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  try {
    const existing = await prisma.company.findFirst()
    if (existing) return NextResponse.json({ message: 'Already seeded', company: existing.slug })

    const company = await prisma.company.create({
      data: { name: 'dArch Capital', slug: 'darch-capital', plan: 'ENTERPRISE' },
    })
    const password = await bcrypt.hash('admin123', 12)
    await prisma.user.create({
      data: { email: 'admin@darch.capital', password, name: 'Администратор', role: 'ADMIN', companyId: company.id },
    })

    return NextResponse.json({ message: 'Seeded successfully', email: 'admin@darch.capital', password: 'admin123' })
  } finally {
    await prisma.$disconnect()
  }
}
