import type { Database } from 'better-sqlite3';

export const SCHEMA_VERSION = '3';

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER,
      title TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')),
      pattern TEXT,
      status TEXT DEFAULT 'Solved' CHECK(status IN ('Solved','In Progress','To Review')),
      solution TEXT,
      notes TEXT,
      date_solved TEXT,
      sr_interval INTEGER DEFAULT 1,
      sr_repetitions INTEGER DEFAULT 0,
      sr_ease REAL DEFAULT 2.5,
      sr_next_review TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_problems_number ON problems(number);
    CREATE INDEX IF NOT EXISTS idx_problems_next_review ON problems(sr_next_review);

    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id      TEXT NOT NULL,
      difficulty      TEXT NOT NULL,
      language        TEXT NOT NULL,
      duration_sec    INTEGER NOT NULL,
      final_code      TEXT,
      evaluation_json TEXT,
      started_at      TEXT NOT NULL,
      finished_at     TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_interview_started ON interview_sessions(started_at);
  `);

  db.prepare('INSERT OR REPLACE INTO schema_meta(key, value) VALUES (?, ?)').run(
    'version',
    SCHEMA_VERSION
  );
}
