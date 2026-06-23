import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';
import { runMigrations } from '../../src/main/db/migrations';
import { bindStatements, clearStatements } from '../../src/main/db/statements';
import { setDb, closeDb } from '../../src/main/db/connection';
import { ProblemsRepo } from '../../src/main/db/problems.repo';

let db: DB;

beforeEach(() => {
  db = new Database(':memory:');
  runMigrations(db);
  bindStatements(db);
});

afterEach(() => {
  clearStatements();
  db.close();
});

describe('ProblemsRepo — CRUD on :memory: DB', () => {
  it('create + get round-trip', () => {
    const { id } = ProblemsRepo.create({
      number: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      pattern: 'hashmap',
      status: 'To Review',
      solution: 'def f(): pass',
      notes: 'classic',
      date_solved: '2026-06-19',
    });
    expect(id).toBeGreaterThan(0);
    const got = ProblemsRepo.get(id);
    expect(got?.title).toBe('Two Sum');
    expect(got?.number).toBe(1);
    expect(got?.pattern).toBe('hashmap');
    expect(got?.sr_next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getByNumber returns inserted row', () => {
    ProblemsRepo.create({ number: 42, title: 'Trapping Rain Water', difficulty: 'Hard' });
    const got = ProblemsRepo.getByNumber(42);
    expect(got?.number).toBe(42);
    expect(got?.title).toBe('Trapping Rain Water');
  });

  it('update mutates fields, leaves SR untouched', () => {
    const { id } = ProblemsRepo.create({
      number: 7,
      title: 'Reverse Integer',
      difficulty: 'Medium',
    });
    const before = ProblemsRepo.get(id)!;
    ProblemsRepo.update(id, {
      number: 7,
      title: 'Reverse Integer (edited)',
      difficulty: 'Medium',
      pattern: 'math',
    });
    const after = ProblemsRepo.get(id)!;
    expect(after.title).toBe('Reverse Integer (edited)');
    expect(after.pattern).toBe('math');
    expect(after.sr_next_review).toBe(before.sr_next_review);
    expect(after.sr_ease).toBe(before.sr_ease);
  });

  it('remove deletes row', () => {
    const { id } = ProblemsRepo.create({ title: 'X', difficulty: 'Easy' });
    ProblemsRepo.remove(id);
    expect(ProblemsRepo.get(id)).toBeNull();
  });

  it('list orders by date_solved DESC then id DESC', () => {
    ProblemsRepo.create({ title: 'A', difficulty: 'Easy', date_solved: '2026-01-01' });
    ProblemsRepo.create({ title: 'B', difficulty: 'Easy', date_solved: '2026-03-01' });
    ProblemsRepo.create({ title: 'C', difficulty: 'Easy', date_solved: '2026-02-01' });
    const titles = ProblemsRepo.list().map((p) => p.title);
    expect(titles).toEqual(['B', 'C', 'A']);
  });

  it('byPattern filters', () => {
    ProblemsRepo.create({ title: 'A', difficulty: 'Easy', pattern: 'sliding-window' });
    ProblemsRepo.create({ title: 'B', difficulty: 'Easy', pattern: 'two-pointers' });
    ProblemsRepo.create({ title: 'C', difficulty: 'Easy', pattern: 'sliding-window' });
    const rows = ProblemsRepo.byPattern('sliding-window');
    expect(rows.map((p) => p.title).sort()).toEqual(['A', 'C']);
  });
});

describe('migrations — schema and indexes', () => {
  it('creates both new indexes', () => {
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='problems'")
      .all() as { name: string }[];
    const names = indexes.map((i) => i.name);
    expect(names).toContain('idx_problems_number');
    expect(names).toContain('idx_problems_next_review');
  });

  it('persists schema version in schema_meta', () => {
    const row = db
      .prepare("SELECT value FROM schema_meta WHERE key='version'")
      .get() as { value: string } | undefined;
    expect(row?.value).toBe('3');
  });
});

describe('connection.setDb wires bindStatements', () => {
  it('list() works after setDb only', () => {
    clearStatements();
    const db2 = new Database(':memory:');
    runMigrations(db2);
    setDb(db2);
    expect(ProblemsRepo.list()).toEqual([]);
    closeDb();
  });
});
