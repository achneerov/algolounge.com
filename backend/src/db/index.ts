import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../models';

const sqlite = new Database(process.env.DATABASE_URL || 'algolounge.db');
export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
