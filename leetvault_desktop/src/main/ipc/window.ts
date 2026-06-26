import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join, resolve } from 'node:path';
import { IpcChannels } from '@shared/ipc-channels';

function senderWindow(e: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender);
}

// In packaged builds the extension is copied to `<resources>/leetcode_extension`
// via electron-builder `extraResources`. In dev it lives at `<repo>/leetcode_extension`.
function extensionFolderPath(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'leetcode_extension');
  return resolve(app.getAppPath(), '..', 'leetcode_extension');
}

export function registerWindowIpc(): void {
  ipcMain.handle(IpcChannels.App.OpenExternal, async (_e, { url }: { url: string }) => {
    if (!/^https?:\/\//i.test(url)) return;
    await shell.openExternal(url);
  });

  ipcMain.handle(IpcChannels.App.ExtensionPath, () => extensionFolderPath());
  ipcMain.handle(IpcChannels.App.OpenExtensionFolder, async () => {
    await shell.openPath(extensionFolderPath());
  });

  ipcMain.handle(IpcChannels.Window.Minimize, (e) => senderWindow(e)?.minimize());
  ipcMain.handle(IpcChannels.Window.ToggleMaximize, (e) => {
    const w = senderWindow(e);
    if (!w) return;
    if (w.isMaximized()) w.unmaximize();
    else w.maximize();
  });
  ipcMain.handle(IpcChannels.Window.Close, (e) => senderWindow(e)?.close());
}
