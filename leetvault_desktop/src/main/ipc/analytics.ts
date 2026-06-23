import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { capture, disableAnalytics, enableAnalytics } from '../analytics/posthog';
import {
  getDistinctId,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../analytics/identity';
import { SettingsRepo } from '../db/settings.repo';
import type { EventProps } from '../analytics/events';

const NOTICE_KEY = 'analytics_notice_seen';

export function registerAnalyticsIpc(): void {
  ipcMain.handle(
    IpcChannels.Analytics.ViewOpened,
    (_e, payload: EventProps['view_opened']) => {
      capture('view_opened', payload);
    }
  );

  ipcMain.handle(
    IpcChannels.Analytics.ReviewSessionFinished,
    (_e, payload: EventProps['review_session_finished']) => {
      capture('review_session_finished', payload);
    }
  );

  ipcMain.handle(IpcChannels.Analytics.GetEnabled, (): boolean => isAnalyticsEnabled());

  ipcMain.handle(
    IpcChannels.Analytics.SetEnabled,
    async (_e, { enabled }: { enabled: boolean }) => {
      const previous = isAnalyticsEnabled();
      setAnalyticsEnabled(enabled);
      if (!enabled && previous) {
        await disableAnalytics();
      } else if (enabled && !previous) {
        enableAnalytics();
      }
    }
  );

  ipcMain.handle(IpcChannels.Analytics.GetDistinctId, (): string | null => getDistinctId());

  ipcMain.handle(
    IpcChannels.Analytics.IsConfigured,
    (): boolean => Boolean(__POSTHOG_KEY__ && __POSTHOG_HOST__)
  );

  ipcMain.handle(
    IpcChannels.Analytics.ShouldShowNotice,
    (): boolean => !SettingsRepo.has(NOTICE_KEY)
  );

  ipcMain.handle(IpcChannels.Analytics.DismissNotice, (): void => {
    SettingsRepo.set(NOTICE_KEY, new Date().toISOString());
  });
}
