import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models',
  out: './src/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './algolounge.db',
  },
} satisfies Config;
