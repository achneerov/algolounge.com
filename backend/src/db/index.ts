import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '../models';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

let dbInstance: any = null;
let db: ReturnType<typeof drizzle> | null = null;

async function initializeDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dbPath = resolve(process.env.DATABASE_URL || 'algolounge.db');

  try {
    const filebuffer = readFileSync(dbPath);
    dbInstance = new SQL.Database(filebuffer);
  } catch {
    dbInstance = new SQL.Database();
  }

  db = drizzle(dbInstance, { schema });

  // Auto-save on changes
  const originalExec = dbInstance.exec.bind(dbInstance);
  dbInstance.exec = function(...args: any[]) {
    const result = originalExec(...args);
    try {
      const data = dbInstance.export();
      writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('Failed to save database:', e);
    }
    return result;
  };

  return db;
}

export { initializeDb, db };
export const getDb = () => db;
export type DB = Awaited<ReturnType<typeof initializeDb>>;
