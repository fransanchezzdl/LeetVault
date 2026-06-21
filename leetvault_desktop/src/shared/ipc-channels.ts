export const IpcChannels = {
  Problems: {
    List: 'db:problems:list',
    Get: 'db:problems:get',
    GetByNumber: 'db:problems:getByNumber',
    Create: 'db:problems:create',
    Update: 'db:problems:update',
    Delete: 'db:problems:delete',
    ByPattern: 'db:problems:byPattern',
  },
  Reviews: {
    Due: 'db:reviews:due',
    NextDate: 'db:reviews:nextDate',
    CountDue: 'db:reviews:countDue',
    Rate: 'sr:rate',
    Finish: 'sr:finish',
  },
  Stats: {
    Bundle: 'db:stats:bundle',
  },
  App: {
    OpenExternal: 'app:openExternal',
    ImportDb: 'app:importDb',
    DbPath: 'app:dbPath',
  },
  Settings: {
    Get: 'settings:get',
    Has: 'settings:has',
    Set: 'settings:set',
    Clear: 'settings:clear',
    EncryptionAvailable: 'settings:encryptionAvailable',
  },
  Interview: {
    Start: 'interview:start',
    Send: 'interview:send',
    Finish: 'interview:finish',
    Abort: 'interview:abort',
    List: 'interview:list',
    Pick: 'interview:pick',
    Stats: 'interview:stats',
  },
  Window: {
    Minimize: 'window:minimize',
    ToggleMaximize: 'window:toggleMaximize',
    Close: 'window:close',
  },
  Events: {
    ProblemsChanged: 'events:problems-changed',
    ReviewsChanged: 'events:reviews-changed',
    ServerStatus: 'events:server-status',
    InterviewStream: 'events:interview-stream',
    InterviewMessage: 'events:interview-message',
  },
} as const;

export type IpcEventPayload = {
  [IpcChannels.Events.ProblemsChanged]: {
    source: 'extension' | 'ui';
    action: 'created' | 'updated' | 'deleted';
    id?: number;
  };
  [IpcChannels.Events.ReviewsChanged]: { id: number };
  [IpcChannels.Events.ServerStatus]: { port: number; running: boolean };
  [IpcChannels.Events.InterviewStream]: {
    sessionId: string;
    delta: string;
    done: boolean;
    error?: string;
  };
  [IpcChannels.Events.InterviewMessage]: {
    sessionId: string;
    role: 'assistant';
    text: string;
  };
};
