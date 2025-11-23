-- Remove starting_countdown_seconds and description from quiz_templates
-- SQLite requires table recreation to drop columns

PRAGMA foreign_keys=OFF;

-- Create new quiz_templates table without starting_countdown_seconds and description
CREATE TABLE quiz_templates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  transition_seconds INTEGER NOT NULL DEFAULT 3,
  created_at INTEGER NOT NULL
);

-- Copy data from old table (excluding dropped columns)
INSERT INTO quiz_templates_new (id, name, transition_seconds, created_at)
SELECT id, name, transition_seconds, created_at FROM quiz_templates;

-- Drop old table
DROP TABLE quiz_templates;

-- Rename new table
ALTER TABLE quiz_templates_new RENAME TO quiz_templates;

PRAGMA foreign_keys=ON;
