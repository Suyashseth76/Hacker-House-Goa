import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const isVercel = Boolean(process.env.VERCEL);
const dbDir = isVercel ? path.resolve('/tmp/db') : path.resolve('db');
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'builder-id.sqlite'));
if (!isVercel) {
  try {
    db.pragma('journal_mode = WAL');
  } catch {
    // WAL mode fallback for serverless environments
  }
}
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS builders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT NOT NULL UNIQUE,
    name TEXT,
    team_name TEXT,
    photo_url TEXT,
    builder_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe, idempotent migration for databases created by an earlier version.
const columns = db.prepare('PRAGMA table_info(builders)').all().map((row) => row.name);
if (!columns.includes('session_token')) {
  db.exec('ALTER TABLE builders ADD COLUMN session_token TEXT');
}
if (!columns.includes('name')) db.exec('ALTER TABLE builders ADD COLUMN name TEXT');
if (!columns.includes('team_name')) db.exec('ALTER TABLE builders ADD COLUMN team_name TEXT');
if (!columns.includes('photo_url')) db.exec('ALTER TABLE builders ADD COLUMN photo_url TEXT');
if (!columns.includes('builder_id')) db.exec('ALTER TABLE builders ADD COLUMN builder_id TEXT');
if (!columns.includes('created_at')) db.exec('ALTER TABLE builders ADD COLUMN created_at TEXT');
if (!columns.includes('updated_at')) db.exec('ALTER TABLE builders ADD COLUMN updated_at TEXT');

// SQLite cannot safely add a UNIQUE constraint to an existing column with one simple ALTER.
// A unique index provides the required database-level uniqueness and is idempotent.
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_builders_builder_id_unique ON builders(builder_id) WHERE builder_id IS NOT NULL');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_builders_session_token_unique ON builders(session_token)');

export default db;
