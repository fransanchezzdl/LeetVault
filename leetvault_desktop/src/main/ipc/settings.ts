import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { SettingsRepo } from '../db/settings.repo';

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannels.Settings.Get, (_e, { key }: { key: string }) =>
    SettingsRepo.get(key)
  );
  ipcMain.handle(IpcChannels.Settings.Has, (_e, { key }: { key: string }) =>
    SettingsRepo.has(key)
  );
  ipcMain.handle(
    IpcChannels.Settings.Set,
    (_e, { key, value }: { key: string; value: string }) => {
      SettingsRepo.set(key, value);
    }
  );
  ipcMain.handle(IpcChannels.Settings.Clear, (_e, { key }: { key: string }) => {
    SettingsRepo.clear(key);
  });
  ipcMain.handle(IpcChannels.Settings.EncryptionAvailable, () =>
    SettingsRepo.encryptionAvailable()
  );
}
