import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';
import { runMigrations } from './migrations';
import { bindStatements, clearStatements } from './statements';

let _db: DB | null = null;

export function openDb(filePath: string): DB {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -4000');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

export function setDb(db: DB): void {
  _db = db;
  bindStatements(db);
}

export function getDb(): DB {
  if (!_db) throw new Error('DB not initialized — call openDb()+setDb() first');
  return _db;
}

export function closeDb(): void {
  if (_db) {
    clearStatements();
    _db.close();
    _db = null;
  }
}
