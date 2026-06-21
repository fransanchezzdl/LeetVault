import { BrowserWindow, app, dialog, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { copyFileSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { IpcChannels } from '@shared/ipc-channels';
import { closeDb, openDb, setDb } from '../db/connection';
import { resolveDbPath } from '../db/path';
import { broadcast } from '../events/bus';

const REQUIRED_COLUMNS = [
  'id',
  'number',
  'title',
  'difficulty',
  'pattern',
  'status',
  'solution',
  'notes',
  'date_solved',
  'sr_interval',
  'sr_repetitions',
  'sr_ease',
  'sr_next_review',
  'created_at',
];

export type ImportResult =
  | { ok: true; imported: number; backupPath: string }
  | { ok: false; reason: 'cancelled' | 'invalid' | 'error'; message?: string };

function validateLegacyDb(path: string): { ok: boolean; rows: number; message?: string } {
  let probe: Database.Database | null = null;
  try {
    probe = new Database(path, { readonly: true, fileMustExist: true });
    const cols = probe.pragma('table_info(problems)') as Array<{ name: string }>;
    if (cols.length === 0) return { ok: false, rows: 0, message: 'No existe la tabla "problems"' };
    const present = new Set(cols.map((c) => c.name));
    const missing = REQUIRED_COLUMNS.filter((c) => !present.has(c));
    if (missing.length) {
      return { ok: false, rows: 0, message: `Faltan columnas: ${missing.join(', ')}` };
    }
    const { c } = probe.prepare('SELECT COUNT(*) AS c FROM problems').get() as { c: number };
    return { ok: true, rows: c };
  } catch (e) {
    return { ok: false, rows: 0, message: (e as Error).message };
  } finally {
    probe?.close();
  }
}

export function registerImportIpc(): void {
  ipcMain.handle(IpcChannels.App.DbPath, () => resolveDbPath());

  ipcMain.handle(IpcChannels.App.ImportDb, async (e): Promise<ImportResult> => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const picked = await dialog.showOpenDialog(win!, {
      title: 'Importar base de datos v1 (leetcode.db)',
      filters: [{ name: 'SQLite', extensions: ['db', 'sqlite', 'sqlite3'] }],
      properties: ['openFile'],
    });
    if (picked.canceled || picked.filePaths.length === 0) {
      return { ok: false, reason: 'cancelled' };
    }
    const src = picked.filePaths[0];

    const validation = validateLegacyDb(src);
    if (!validation.ok) {
      return { ok: false, reason: 'invalid', message: validation.message };
    }

    const confirm = await dialog.showMessageBox(win!, {
      type: 'warning',
      buttons: ['Cancelar', 'Sobrescribir e importar'],
      defaultId: 1,
      cancelId: 0,
      title: 'Reemplazar base de datos',
      message: `Se importarán ${validation.rows} problemas desde:\n${src}\n\nLa base de datos actual se respaldará y será reemplazada. ¿Continuar?`,
    });
    if (confirm.response !== 1) return { ok: false, reason: 'cancelled' };

    try {
      const dbPath = resolveDbPath();
      closeDb();

      let backupPath = '';
      if (existsSync(dbPath)) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = join(app.getPath('userData'), `leetcode.backup-${ts}.db`);
        renameSync(dbPath, backupPath);
        for (const sib of ['leetcode.db-wal', 'leetcode.db-shm']) {
          const sibPath = join(app.getPath('userData'), sib);
          if (existsSync(sibPath)) renameSync(sibPath, `${backupPath}-${sib.split('.').pop()}`);
        }
      }

      copyFileSync(src, dbPath);
      const db = openDb(dbPath);
      setDb(db);

      broadcast(IpcChannels.Events.ProblemsChanged, { source: 'ui', action: 'updated' });
      return { ok: true, imported: validation.rows, backupPath };
    } catch (err) {
      try {
        const db = openDb(resolveDbPath());
        setDb(db);
      } catch {
        /* ignore re-open failure */
      }
      return { ok: false, reason: 'error', message: (err as Error).message };
    }
  });
}
