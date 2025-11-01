import initSqlJs from 'sql.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function initializeDatabase() {
  const SQL = await initSqlJs();
  const dbPath = resolve('algolounge.db');
  const db = new SQL.Database();

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )
  `);

  // Create favorite_courses table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorite_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_filename TEXT NOT NULL,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_filename)
    )
  `);

  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
  console.log('✓ Database initialized successfully at ' + dbPath);
}

initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
