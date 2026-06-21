import { BrowserWindow, ipcMain, shell } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';

function senderWindow(e: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender);
}

export function registerWindowIpc(): void {
  ipcMain.handle(IpcChannels.App.OpenExternal, async (_e, { url }: { url: string }) => {
    if (!/^https?:\/\//i.test(url)) return;
    await shell.openExternal(url);
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
