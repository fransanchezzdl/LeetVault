import { app, BrowserWindow, dialog, shell } from 'electron';
import { join } from 'node:path';
import { APP_NAME } from '@shared/constants';
import { resolveDbPath } from './db/path';
import { openDb, setDb, closeDb } from './db/connection';
import { registerIpc } from './ipc/register';
import { startServer, stopServer, SERVER_PORT } from './server/fastify';

// Must be set BEFORE any call to app.getPath('userData') so all OSes resolve to a
// directory named "LeetVault" (matches the v1 Inno Setup path on Windows exactly).
app.setName(APP_NAME);

// Chromium on Linux silently drops speechSynthesis.speak() unless speech-dispatcher
// is enabled. The flag is a no-op on macOS/Windows.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-speech-dispatcher');
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function createMainWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin';
  const nativeFrame = process.env.LV_NATIVE_FRAME === '1';

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    show: false,
    backgroundColor: nativeFrame || isMac ? '#211711' : '#00000000',
    transparent: !nativeFrame && !isMac,
    frame: nativeFrame || isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

app.whenReady().then(async () => {
  const dbPath = resolveDbPath();
  const db = openDb(dbPath);
  setDb(db);

  registerIpc();

  try {
    await startServer();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') {
      dialog.showErrorBox(
        'LeetVault is already running',
        `Another LeetVault process is using port ${SERVER_PORT}. Close it before starting this one.`
      );
    } else {
      dialog.showErrorBox('LeetVault server failed to start', String(err));
    }
    app.quit();
    return;
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async (e) => {
  e.preventDefault();
  try {
    await stopServer();
  } finally {
    closeDb();
    app.exit(0);
  }
});
