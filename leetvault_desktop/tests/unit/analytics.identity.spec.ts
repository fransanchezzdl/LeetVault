import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import type { Database as DB } from 'better-sqlite3';

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (s: string) => Buffer.from(s, 'utf8'),
    decryptString: (b: Buffer) => b.toString('utf8'),
  },
}));

const { runMigrations } = await import('../../src/main/db/migrations');
const { bindStatements, clearStatements } = await import('../../src/main/db/statements');
const { setDb, closeDb } = await import('../../src/main/db/connection');
const {
  getOrCreateIdentity,
  getDistinctId,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  isFirstLaunch,
  markFirstLaunchSeen,
} = await import('../../src/main/analytics/identity');

let db: DB;

beforeEach(() => {
  db = new Database(':memory:');
  runMigrations(db);
  bindStatements(db);
  setDb(db);
});

afterEach(() => {
  clearStatements();
  closeDb();
});

describe('analytics identity', () => {
  it('getOrCreateIdentity generates a UUID once and reuses it', () => {
    expect(getDistinctId()).toBeNull();
    const first = getOrCreateIdentity();
    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    const second = getOrCreateIdentity();
    expect(second).toBe(first);
    expect(getDistinctId()).toBe(first);
  });

  it('isAnalyticsEnabled defaults to true (opt-out)', () => {
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('setAnalyticsEnabled persists toggle and isAnalyticsEnabled reflects it', () => {
    setAnalyticsEnabled(false);
    expect(isAnalyticsEnabled()).toBe(false);
    setAnalyticsEnabled(true);
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('isFirstLaunch flips after markFirstLaunchSeen', () => {
    expect(isFirstLaunch()).toBe(true);
    markFirstLaunchSeen();
    expect(isFirstLaunch()).toBe(false);
  });
});
