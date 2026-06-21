import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

vi.mock('../../src/main/events/bus', () => import('../helpers/events-bus-stub'));

import Database from 'better-sqlite3';
import type { FastifyInstance } from 'fastify';
import { runMigrations } from '../../src/main/db/migrations';
import { bindStatements, clearStatements } from '../../src/main/db/statements';
import { buildServer } from '../../src/main/server/fastify';
import { ProblemsRepo } from '../../src/main/db/problems.repo';

let app: FastifyInstance;
let db: Database.Database;

beforeEach(async () => {
  db = new Database(':memory:');
  runMigrations(db);
  bindStatements(db);
  app = await buildServer();
  await app.ready();
});

afterEach(async () => {
  await app.close();
  clearStatements();
  db.close();
});

function post(payload: unknown) {
  return app.inject({
    method: 'POST',
    url: '/save',
    headers: { 'content-type': 'application/json', origin: 'chrome-extension://abc' },
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

describe('POST /save — happy path', () => {
  it('creates a new problem (no existing number)', async () => {
    const res = await post({
      number: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      pattern: 'hashmap',
      solution: 'def f(): pass',
      notes: 'classic',
      date_solved: '2026-06-19',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ saved: true, action: 'created' });
    expect(ProblemsRepo.getByNumber(1)?.title).toBe('Two Sum');
  });

  it('updates an existing problem (matched by number)', async () => {
    ProblemsRepo.create({ number: 7, title: 'old title', difficulty: 'Easy' });
    const existing = ProblemsRepo.getByNumber(7)!;
    const res = await post({ number: 7, title: 'new title', difficulty: 'Medium' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ saved: true, action: 'updated', id: existing.id });
    expect(ProblemsRepo.get(existing.id)?.title).toBe('new title');
  });
});

describe('POST /save — validation', () => {
  it('400 on missing title', async () => {
    const res = await post({ number: 1, title: '' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Title is required' });
  });

  it('400 on invalid number (out of range)', async () => {
    const res = await post({ number: 99999, title: 'X' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid problem number' });
  });

  it('400 on non-integer number', async () => {
    const res = await post({ number: 1.5, title: 'X' });
    expect(res.statusCode).toBe(400);
  });

  it('coerces invalid difficulty to "Medium"', async () => {
    const res = await post({ number: 2, title: 'X', difficulty: 'Impossible' });
    expect(res.statusCode).toBe(200);
    expect(ProblemsRepo.getByNumber(2)?.difficulty).toBe('Medium');
  });

  it('coerces invalid status to "Solved"', async () => {
    const res = await post({ number: 3, title: 'X', difficulty: 'Easy', status: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(ProblemsRepo.getByNumber(3)?.status).toBe('Solved');
  });

  it('drops invalid date_solved (non YYYY-MM-DD)', async () => {
    const res = await post({ number: 4, title: 'X', difficulty: 'Easy', date_solved: 'yesterday' });
    expect(res.statusCode).toBe(200);
    expect(ProblemsRepo.getByNumber(4)?.date_solved).toBeNull();
  });

  it('400 on invalid JSON body', async () => {
    const res = await post('not-json{');
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: string }).error).toBe('Invalid JSON');
  });

  it('400 on array body', async () => {
    const res = await post([]);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid payload' });
  });

  it('413 when body exceeds 1MB limit', async () => {
    const huge = { number: 5, title: 'X', solution: 'a'.repeat(1024 * 1024 + 100) };
    const res = await post(huge);
    expect(res.statusCode).toBe(413);
  });
});

describe('POST /save — CORS gate', () => {
  it('403 when origin is not chrome-extension', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/save',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      payload: JSON.stringify({ title: 'x', difficulty: 'Easy' }),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'Forbidden' });
  });

  it('allows local call with no Origin header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/save',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ title: 'local', difficulty: 'Easy' }),
    });
    expect(res.statusCode).toBe(200);
  });
});
