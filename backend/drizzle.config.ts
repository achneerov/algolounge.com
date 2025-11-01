import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models',
  out: './src/db/migrations',
  driver: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./algolounge.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
