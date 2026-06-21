import type { Problem, ProblemDraft } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';
import type { StatsBundle } from '@shared/types/stats';
import type { IpcEventPayload } from '@shared/ipc-channels';
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

type LvEventChannel = keyof IpcEventPayload;

export interface LvApi {
  problems: {
    list: () => Promise<Problem[]>;
    get: (id: number) => Promise<Problem | null>;
    getByNumber: (number: number) => Promise<Problem | null>;
    create: (draft: ProblemDraft) => Promise<{ id: number }>;
    update: (id: number, draft: ProblemDraft) => Promise<void>;
    remove: (id: number) => Promise<void>;
    byPattern: (pattern: string) => Promise<Problem[]>;
  };
  reviews: {
    due: () => Promise<Problem[]>;
    nextDate: () => Promise<string | null>;
    countDue: () => Promise<number>;
    rate: (id: number, quality: Quality) => Promise<void>;
    finish: (id: number) => Promise<void>;
  };
  stats: {
    bundle: () => Promise<StatsBundle>;
  };
  app: {
    openExternal: (url: string) => Promise<void>;
    importDb: () => Promise<
      | { ok: true; imported: number; backupPath: string }
      | { ok: false; reason: 'cancelled' | 'invalid' | 'error'; message?: string }
    >;
    dbPath: () => Promise<string>;
  };
  window: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    has: (key: string) => Promise<boolean>;
    set: (key: string, value: string) => Promise<void>;
    clear: (key: string) => Promise<void>;
    encryptionAvailable: () => Promise<boolean>;
  };
  interview: {
    pick: (
      difficulty: InterviewDifficulty | 'unknown'
    ) => Promise<InterviewProblemPublic | null>;
    start: (args: InterviewStartArgs) => Promise<InterviewStartResult | null>;
    send: (args: InterviewSendArgs) => Promise<void>;
    finish: (args: InterviewFinishArgs) => Promise<InterviewFinishResult | null>;
    abort: (sessionId: string) => Promise<void>;
    list: (limit?: number) => Promise<InterviewSessionSummary[]>;
    stats: () => Promise<InterviewStatsBundle>;
  };
  on: <C extends LvEventChannel>(
    channel: C,
    handler: (payload: IpcEventPayload[C]) => void
  ) => () => void;
}

declare global {
  interface Window {
    lv: LvApi;
  }
}

declare module '*.png' {
  const src: string;
  export default src;
}

export {};
