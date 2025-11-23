-- Remove default value from role_id, keep NOT NULL constraint
-- SQLite requires table recreation to modify column constraints

PRAGMA foreign_keys=OFF;

-- Create new users table without default on role_id
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES user_roles(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Copy all data from old table to new table
INSERT INTO users_new (id, username, email, password_hash, role_id, created_at, updated_at)
SELECT id, username, email, password_hash, role_id, created_at, updated_at FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table to users
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE UNIQUE INDEX users_username_unique ON users (username);
CREATE UNIQUE INDEX users_email_unique ON users (email);

PRAGMA foreign_keys=ON;
