import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://appuser:password123@localhost:5432/darch_capital',
  },
})
