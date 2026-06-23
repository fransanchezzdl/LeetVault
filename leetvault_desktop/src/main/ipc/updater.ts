import { ipcMain, shell } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import type { UpdateInfo } from '@shared/types/updater';
import { capture } from '../analytics/posthog';
import { checkForUpdates, clearSnooze, snoozeUpdate } from '../updater/check';

let promptCapturedFor: string | null = null;

export function registerUpdaterIpc(): void {
  ipcMain.handle(
    IpcChannels.App.CheckForUpdates,
    async (): Promise<UpdateInfo | null> => {
      const info = await checkForUpdates();
      if (info && promptCapturedFor !== info.latest) {
        promptCapturedFor = info.latest;
        capture('update_prompt_shown', { latest: info.latest });
      }
      return info;
    }
  );

  ipcMain.handle(
    IpcChannels.App.DismissUpdate,
    async (
      _e,
      payload: { version: string; action: 'opened' | 'dismissed'; url?: string }
    ) => {
      if (payload.action === 'opened') {
        clearSnooze();
        if (payload.url) {
          await shell.openExternal(payload.url);
        }
      } else {
        snoozeUpdate(payload.version);
      }
      capture('update_prompt_action', { action: payload.action });
    }
  );
}
