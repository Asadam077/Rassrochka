import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL || 'postgresql://appuser:password123@localhost:5432/darch_capital'
const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const company = await prisma.company.create({
    data: {
      name: 'dArch Capital',
      slug: 'darch-capital',
      plan: 'ENTERPRISE',
    },
  })

  const password = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@darch.capital',
      password,
      name: 'Администратор',
      role: 'ADMIN',
      companyId: company.id,
    },
  })

  console.log('✓ Company:', company.slug)
  console.log('✓ Admin:', admin.email)
  console.log('✓ Password: admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
