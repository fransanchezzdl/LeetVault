import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, type IpcEventPayload } from '@shared/ipc-channels';
import type { Lang } from '@shared/lang';
import type { Problem, ProblemDraft } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';
import type { StatsBundle } from '@shared/types/stats';
import type {
  InterviewDifficulty,
  InterviewFinishArgs,
  InterviewFinishResult,
  InterviewProblemPublic,
  InterviewSendArgs,
  InterviewSessionSummary,
  InterviewStartArgs,
  InterviewStartResult,
  InterviewStatsBundle,
} from '@shared/types/interview';
import type { UpdateInfo } from '@shared/types/updater';

const invoke = <T = unknown>(channel: string, payload?: unknown): Promise<T> =>
  ipcRenderer.invoke(channel, payload);

// One synchronous read at preload time so the renderer can initialise i18next
// before first paint — see src/renderer/i18n/index.ts.
const initialLocale: Lang =
  (ipcRenderer.sendSync(IpcChannels.App.GetInitialLocale) as Lang) ?? 'en';

type EventChannel = (typeof IpcChannels.Events)[keyof typeof IpcChannels.Events];

function subscribe<C extends EventChannel>(
  channel: C,
  handler: (payload: IpcEventPayload[C]) => void
): () => void {
  const listener = (_e: Electron.IpcRendererEvent, payload: IpcEventPayload[C]): void =>
    handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api = {
  problems: {
    list: (): Promise<Problem[]> => invoke(IpcChannels.Problems.List),
    get: (id: number): Promise<Problem | null> => invoke(IpcChannels.Problems.Get, { id }),
    getByNumber: (number: number): Promise<Problem | null> =>
      invoke(IpcChannels.Problems.GetByNumber, { number }),
    create: (draft: ProblemDraft): Promise<{ id: number }> =>
      invoke(IpcChannels.Problems.Create, draft),
    update: (id: number, draft: ProblemDraft): Promise<void> =>
      invoke(IpcChannels.Problems.Update, { id, ...draft }),
    remove: (id: number): Promise<void> => invoke(IpcChannels.Problems.Delete, { id }),
    byPattern: (pattern: string): Promise<Problem[]> =>
      invoke(IpcChannels.Problems.ByPattern, { pattern }),
  },
  reviews: {
    due: (): Promise<Problem[]> => invoke(IpcChannels.Reviews.Due),
    nextDate: (): Promise<string | null> => invoke(IpcChannels.Reviews.NextDate),
    countDue: (): Promise<number> => invoke(IpcChannels.Reviews.CountDue),
    rate: (id: number, quality: Quality): Promise<void> =>
      invoke(IpcChannels.Reviews.Rate, { id, quality }),
    finish: (id: number): Promise<void> => invoke(IpcChannels.Reviews.Finish, { id }),
  },
  stats: {
    bundle: (): Promise<StatsBundle> => invoke(IpcChannels.Stats.Bundle),
  },
  app: {
    openExternal: (url: string): Promise<void> =>
      invoke(IpcChannels.App.OpenExternal, { url }),
    importDb: (): Promise<
      | { ok: true; imported: number; backupPath: string }
      | { ok: false; reason: 'cancelled' | 'invalid' | 'error'; message?: string }
    > => invoke(IpcChannels.App.ImportDb),
    dbPath: (): Promise<string> => invoke(IpcChannels.App.DbPath),
    extensionPath: (): Promise<string> => invoke(IpcChannels.App.ExtensionPath),
    openExtensionFolder: (): Promise<void> => invoke(IpcChannels.App.OpenExtensionFolder),
    checkForUpdates: (): Promise<UpdateInfo | null> =>
      invoke(IpcChannels.App.CheckForUpdates),
    dismissUpdate: (
      version: string,
      action: 'opened' | 'dismissed',
      url?: string
    ): Promise<void> =>
      invoke(IpcChannels.App.DismissUpdate, { version, action, url }),
    initialLocale,
    localeChanged: (lang: Lang): Promise<void> =>
      invoke(IpcChannels.App.LocaleChanged, { lang }),
  },
  window: {
    minimize: (): Promise<void> => invoke(IpcChannels.Window.Minimize),
    toggleMaximize: (): Promise<void> => invoke(IpcChannels.Window.ToggleMaximize),
    close: (): Promise<void> => invoke(IpcChannels.Window.Close),
  },
  settings: {
    get: (key: string): Promise<string | null> => invoke(IpcChannels.Settings.Get, { key }),
    has: (key: string): Promise<boolean> => invoke(IpcChannels.Settings.Has, { key }),
    set: (key: string, value: string): Promise<void> =>
      invoke(IpcChannels.Settings.Set, { key, value }),
    clear: (key: string): Promise<void> => invoke(IpcChannels.Settings.Clear, { key }),
    encryptionAvailable: (): Promise<boolean> =>
      invoke(IpcChannels.Settings.EncryptionAvailable),
  },
  interview: {
    pick: (difficulty: InterviewDifficulty | 'unknown'): Promise<InterviewProblemPublic | null> =>
      invoke(IpcChannels.Interview.Pick, { difficulty }),
    start: (args: InterviewStartArgs): Promise<InterviewStartResult | null> =>
      invoke(IpcChannels.Interview.Start, args),
    send: (args: InterviewSendArgs): Promise<void> =>
      invoke(IpcChannels.Interview.Send, args),
    finish: (args: InterviewFinishArgs): Promise<InterviewFinishResult | null> =>
      invoke(IpcChannels.Interview.Finish, args),
    abort: (sessionId: string): Promise<void> =>
      invoke(IpcChannels.Interview.Abort, { sessionId }),
    list: (limit?: number): Promise<InterviewSessionSummary[]> =>
      invoke(IpcChannels.Interview.List, { limit }),
    stats: (): Promise<InterviewStatsBundle> =>
      invoke(IpcChannels.Interview.Stats),
  },
  analytics: {
    viewOpened: (
      view: 'problems' | 'review' | 'stats' | 'roadmap' | 'help' | 'interview' | 'settings'
    ): Promise<void> => invoke(IpcChannels.Analytics.ViewOpened, { view }),
    reviewSessionFinished: (count: number): Promise<void> =>
      invoke(IpcChannels.Analytics.ReviewSessionFinished, { count }),
    getEnabled: (): Promise<boolean> => invoke(IpcChannels.Analytics.GetEnabled),
    setEnabled: (enabled: boolean): Promise<void> =>
      invoke(IpcChannels.Analytics.SetEnabled, { enabled }),
    getDistinctId: (): Promise<string | null> => invoke(IpcChannels.Analytics.GetDistinctId),
    isConfigured: (): Promise<boolean> => invoke(IpcChannels.Analytics.IsConfigured),
    shouldShowNotice: (): Promise<boolean> => invoke(IpcChannels.Analytics.ShouldShowNotice),
    dismissNotice: (): Promise<void> => invoke(IpcChannels.Analytics.DismissNotice),
  },
  on: subscribe,
};

contextBridge.exposeInMainWorld('lv', api);

export type LvApi = typeof api;
