import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(__dirname, "../../database.db");
const migrationsDir = path.join(__dirname, "./migrations");

// Create database connection
const sqlite = new Database(dbPath);

// Run migrations if they exist
try {
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      sqlite.exec(sql);
      console.log(`Executed migration: ${file}`);
    }
  }

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS favorite_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_filename TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_filename)
    );
  `);

  console.log("Database initialized successfully");
  sqlite.close();
} catch (error) {
  console.error("Migration error:", error);
  process.exit(1);
}
