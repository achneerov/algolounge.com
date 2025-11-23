-- Update any existing users with NULL role_id to 'member' (id=2)
UPDATE users SET role_id = 2 WHERE role_id IS NULL;

-- In SQLite, we need to recreate the table to add NOT NULL constraint with default
-- This is a safe operation that preserves all data

PRAGMA foreign_keys=OFF;

-- Create new users table with NOT NULL constraint on role_id
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL DEFAULT 2 REFERENCES user_roles(id),
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
