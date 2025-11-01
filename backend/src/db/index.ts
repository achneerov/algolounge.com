import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(__dirname, "../../database.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Run migrations on startup
export async function initializeDatabase() {
  // Migrations are handled by Drizzle migrations
  // Database will be created/migrated on first run
}
