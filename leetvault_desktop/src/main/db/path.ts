import { app } from 'electron';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Resolves the SQLite path under Electron's `userData` directory so it sits
 * next to the v1 (Inno Setup) location on Windows/macOS automatically.
 *
 * Linux gets a one-shot migration: v1 (PyInstaller) used `~/.local/share/LeetVault`,
 * v2 (Electron default) uses `~/.config/LeetVault`. We copy the file (+ -wal/-shm
 * siblings if present) on first launch.
 */
export function resolveDbPath(): string {
  const dir = app.getPath('userData');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const dbPath = join(dir, 'leetcode.db');

  if (process.platform === 'linux' && !existsSync(dbPath)) {
    const legacyDir = join(homedir(), '.local', 'share', 'LeetVault');
    const legacyDb = join(legacyDir, 'leetcode.db');
    if (existsSync(legacyDb)) {
      copyFileSync(legacyDb, dbPath);
      for (const sib of ['leetcode.db-wal', 'leetcode.db-shm']) {
        const src = join(legacyDir, sib);
        if (existsSync(src)) copyFileSync(src, join(dir, sib));
      }
    }
  }

  return dbPath;
}

export function ensureParent(filePath: string): void {
  const parent = dirname(filePath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
}
