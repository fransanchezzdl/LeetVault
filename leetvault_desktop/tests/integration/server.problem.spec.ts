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

describe('GET /status', () => {
  it('returns ok payload identical to Python server', async () => {
    const res = await app.inject({ method: 'GET', url: '/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', app: 'LeetVault' });
  });
});

describe('GET /api/problems', () => {
  it('returns { problems: [...] } envelope', async () => {
    ProblemsRepo.create({ number: 1, title: 'Two Sum', difficulty: 'Easy' });
    const res = await app.inject({ method: 'GET', url: '/api/problems' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { problems: Array<{ title: string }> };
    expect(body.problems).toHaveLength(1);
    expect(body.problems[0].title).toBe('Two Sum');
  });
});

describe('GET /problem/:n', () => {
  it('found:true when row exists', async () => {
    ProblemsRepo.create({ number: 42, title: 'Trapping Rain Water', difficulty: 'Hard' });
    const res = await app.inject({ method: 'GET', url: '/problem/42' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { found: boolean; problem?: { number: number } };
    expect(body.found).toBe(true);
    expect(body.problem?.number).toBe(42);
  });

  it('found:false when missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/problem/9000' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ found: false });
  });

  it('400 for non-numeric path', async () => {
    const res = await app.inject({ method: 'GET', url: '/problem/abc' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid problem number' });
  });

  it('400 for out-of-range', async () => {
    const res = await app.inject({ method: 'GET', url: '/problem/10000' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/stats', () => {
  it('returns { stats, due_reviews, next_review } envelope', async () => {
    ProblemsRepo.create({ number: 1, title: 'A', difficulty: 'Easy', pattern: 'hashmap' });
    ProblemsRepo.create({ number: 2, title: 'B', difficulty: 'Hard', pattern: 'dp' });
    const res = await app.inject({ method: 'GET', url: '/api/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      stats: { total: number };
      due_reviews: number;
      next_review: string | null;
    };
    expect(body.stats.total).toBe(2);
    expect(typeof body.due_reviews).toBe('number');
  });
});

describe('OPTIONS preflight + CORS', () => {
  it('allows chrome-extension origin and echoes it', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/save',
      headers: { origin: 'chrome-extension://abc123' },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('chrome-extension://abc123');
    expect(res.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
    expect(res.headers['access-control-allow-headers']).toBe('Content-Type');
  });

  it('omits ACAO header when no Origin (local call)', async () => {
    const res = await app.inject({ method: 'GET', url: '/status' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects unknown origin with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/status',
      headers: { origin: 'https://evil.example' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'Forbidden' });
  });
});

describe('Not found', () => {
  it('404 with {error:"Not found"} body', async () => {
    const res = await app.inject({ method: 'GET', url: '/no-such-route' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Not found' });
  });
});
