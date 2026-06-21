import { safeStorage } from 'electron';
import { getDb } from './connection';

const SECRET_PREFIX = 'enc:';

function isEncrypted(value: string): boolean {
  return value.startsWith(SECRET_PREFIX);
}

function encrypt(plain: string): string {
  if (!safeStorage.isEncryptionAvailable()) return plain;
  const buf = safeStorage.encryptString(plain);
  return SECRET_PREFIX + buf.toString('base64');
}

function decrypt(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const b64 = stored.slice(SECRET_PREFIX.length);
  const buf = Buffer.from(b64, 'base64');
  return safeStorage.decryptString(buf);
}

export const SECRET_KEYS = new Set(['groq_api_key']);

export const SettingsRepo = {
  get(key: string): string | null {
    const row = getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined;
    if (!row) return null;
    try {
      return decrypt(row.value);
    } catch {
      return null;
    }
  },

  has(key: string): boolean {
    const row = getDb()
      .prepare('SELECT 1 FROM settings WHERE key = ?')
      .get(key) as { 1: number } | undefined;
    return !!row;
  },

  set(key: string, value: string): void {
    const stored = SECRET_KEYS.has(key) ? encrypt(value) : value;
    getDb()
      .prepare('INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)')
      .run(key, stored);
  },

  clear(key: string): void {
    getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
  },

  encryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  },
};
