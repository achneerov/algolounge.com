import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'algolounge.db',
  },
} satisfies Config;
