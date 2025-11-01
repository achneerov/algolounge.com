import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../models';

// For local development, use a file path. For production, use Turso
const dbUrl = process.env.DATABASE_URL || 'file:./algolounge.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: dbUrl,
  ...(authToken && { authToken }),
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
