import { BrowserWindow } from 'electron';
import { IpcChannels, type IpcEventPayload } from '@shared/ipc-channels';

type EventChannel = (typeof IpcChannels.Events)[keyof typeof IpcChannels.Events];

export function broadcast<C extends EventChannel>(
  channel: C,
  payload: IpcEventPayload[C]
): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
}
