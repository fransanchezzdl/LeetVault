import { create } from 'zustand';
import type {
  InterviewDifficulty,
  InterviewEvaluation,
  InterviewLanguage,
  InterviewProblem,
  InterviewProblemPublic,
} from '@shared/types/interview';

export type InterviewPhase = 'setup' | 'live' | 'evaluation';

export interface InterviewChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

interface InterviewState {
  phase: InterviewPhase;
  sessionId: string | null;
  problemPublic: InterviewProblemPublic | null;
  problemFull: InterviewProblem | null;

  difficulty: InterviewDifficulty | 'unknown';
  language: InterviewLanguage;
  timerMin: number | null; // null = off
  startedAt: number | null;

  messages: InterviewChatMessage[];
  code: string;

  // Live timer
  timerRemainingSec: number | null;

  // Live readiness — true once the code editor has mounted. Timer only
  // starts after this flips so the user isn't penalised by Monaco's load.
  editorReady: boolean;

  // Evaluation results
  evaluation: InterviewEvaluation | null;
  evaluationRaw: string | undefined;

  // UI / network state
  sending: boolean;
  finishing: boolean;
  streamError: string | null;

  // Voice prefs (persisted via settings IPC, mirrored in store for UI)
  ttsEnabled: boolean;
}

interface InterviewActions {
  setDifficulty: (d: InterviewDifficulty | 'unknown') => void;
  setLanguage: (l: InterviewLanguage) => void;
  setTimerMin: (m: number | null) => void;

  beginLive: (args: {
    sessionId: string;
    problemPublic: InterviewProblemPublic;
    startedAt: number;
  }) => void;

  /** Called once the Monaco editor has mounted in LivePanel. Starts timer. */
  markEditorReady: () => void;

  resetToSetup: () => void;

  appendAssistantDelta: (delta: string) => void;
  finalizeAssistant: (text: string) => void;
  pushUser: (text: string) => void;
  setStreamError: (msg: string | null) => void;

  setCode: (code: string) => void;
  setTimerRemaining: (s: number | null) => void;
  setSending: (b: boolean) => void;
  setFinishing: (b: boolean) => void;

  finishToEvaluation: (args: {
    evaluation: InterviewEvaluation | null;
    evaluationRaw?: string;
    problemFull: InterviewProblem;
  }) => void;

  setTtsEnabled: (b: boolean) => void;
}

export type InterviewStore = InterviewState & InterviewActions;

const initialState: InterviewState = {
  phase: 'setup',
  sessionId: null,
  problemPublic: null,
  problemFull: null,
  difficulty: 'Medium',
  language: 'python',
  timerMin: 45,
  startedAt: null,
  messages: [],
  code: '',
  timerRemainingSec: null,
  editorReady: false,
  evaluation: null,
  evaluationRaw: undefined,
  sending: false,
  finishing: false,
  streamError: null,
  ttsEnabled: false,
};

export const useInterview = create<InterviewStore>((set) => ({
  ...initialState,

  setDifficulty: (d) => set({ difficulty: d }),
  setLanguage: (l) => set({ language: l }),
  setTimerMin: (m) => set({ timerMin: m }),

  beginLive: ({ sessionId, problemPublic, startedAt }) =>
    set(() => ({
      phase: 'live',
      sessionId,
      problemPublic,
      startedAt,
      messages: [
        {
          id: cryptoRandomId(),
          role: 'assistant',
          text: '',
          streaming: true,
        },
      ],
      // Timer is intentionally NOT started here. markEditorReady() sets it
      // once Monaco has mounted so a slow editor load doesn't eat the clock.
      timerRemainingSec: null,
      editorReady: false,
      streamError: null,
    })),

  markEditorReady: () =>
    set((s) => {
      if (s.editorReady) return {};
      return {
        editorReady: true,
        // Reset the clock so neither the elapsed counter (no-timer mode)
        // nor the durationSec sent to the evaluator counts Monaco load.
        startedAt: Date.now(),
        timerRemainingSec: s.timerMin != null ? s.timerMin * 60 : null,
      };
    }),

  resetToSetup: () =>
    set((s) => ({
      ...initialState,
      // preserve user setup preferences
      difficulty: s.difficulty,
      language: s.language,
      timerMin: s.timerMin,
    })),

  appendAssistantDelta: (delta) =>
    set((s) => {
      const messages = s.messages.slice();
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant' && last.streaming) {
        messages[messages.length - 1] = { ...last, text: last.text + delta };
      } else {
        messages.push({
          id: cryptoRandomId(),
          role: 'assistant',
          text: delta,
          streaming: true,
        });
      }
      return { messages };
    }),

  finalizeAssistant: (text) =>
    set((s) => {
      const messages = s.messages.slice();
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant' && last.streaming) {
        messages[messages.length - 1] = { ...last, text, streaming: false };
      } else {
        messages.push({
          id: cryptoRandomId(),
          role: 'assistant',
          text,
          streaming: false,
        });
      }
      return { messages };
    }),

  pushUser: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: cryptoRandomId(), role: 'user', text, streaming: false },
        { id: cryptoRandomId(), role: 'assistant', text: '', streaming: true },
      ],
    })),

  setStreamError: (msg) => set({ streamError: msg }),

  setCode: (code) => set({ code }),
  setTimerRemaining: (s) => set({ timerRemainingSec: s }),
  setSending: (b) => set({ sending: b }),
  setFinishing: (b) => set({ finishing: b }),

  finishToEvaluation: ({ evaluation, evaluationRaw, problemFull }) =>
    set({
      phase: 'evaluation',
      evaluation,
      evaluationRaw,
      problemFull,
      finishing: false,
    }),

  setTtsEnabled: (b) => set({ ttsEnabled: b }),
}));

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
