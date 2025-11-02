import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbPath = path.join(__dirname, "../../database.db");
const migrationsFolder = path.join(__dirname, "./migrations");

try {
  // Create database connection
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Run migrations
  console.log("Running migrations...");
  migrate(db, { migrationsFolder });
  console.log("✓ Database migrations completed successfully");

  sqlite.close();
} catch (error) {
  console.error("Migration error:", error);
  process.exit(1);
}
