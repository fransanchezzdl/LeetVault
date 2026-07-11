import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import type {
  InterviewDifficulty,
  InterviewFinishArgs,
  InterviewFinishResult,
  InterviewProblemPublic,
  InterviewSendArgs,
  InterviewSessionSummary,
  InterviewSpeakArgs,
  InterviewSpeakResult,
  InterviewStartArgs,
  InterviewStartResult,
  InterviewStatsBundle,
  InterviewTranscribeArgs,
  InterviewTranscribeResult,
} from '@shared/types/interview';
import { pickProblem, publicView } from '../interview/picker';
import { transcribeAudio, synthesizeSpeech } from '../ai/groq';
import { userFacingError } from '../ai/types';
import {
  endSession,
  finishSession,
  getSession,
  openingTurn,
  startSession,
  userMessage,
} from '../interview/session';
import { InterviewRepo } from '../db/interview.repo';
import { capture } from '../analytics/posthog';

export function registerInterviewIpc(): void {
  ipcMain.handle(
    IpcChannels.Interview.Pick,
    (
      _e,
      { difficulty }: { difficulty: InterviewDifficulty | 'unknown' }
    ): InterviewProblemPublic | null => {
      const p = pickProblem(difficulty);
      return p ? publicView(p) : null;
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Start,
    (_e, args: InterviewStartArgs): InterviewStartResult | null => {
      const started = startSession(args.difficulty, args.language);
      if (!started) return null;
      // Defer the opening turn one tick so the renderer can transition to
      // LivePanel and subscribe to interview-stream events before the first
      // Groq delta arrives — otherwise the opening message can be lost.
      setTimeout(() => void openingTurn(started.sessionId), 50);
      capture('interview_started', {
        difficulty: args.difficulty,
        language: args.language,
      });
      return {
        sessionId: started.sessionId,
        problemPublic: publicView(started.problem),
      };
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Send,
    async (_e, args: InterviewSendArgs): Promise<void> => {
      await userMessage(args.sessionId, args.text, args.code, args.language);
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Finish,
    async (_e, args: InterviewFinishArgs): Promise<InterviewFinishResult | null> => {
      const result = await finishSession(
        args.sessionId,
        args.finalCode,
        args.language,
        args.durationSec
      );
      if (result) {
        capture('interview_finished', {
          duration_sec: args.durationSec,
          verdict: result.evaluation?.overall ?? 'No Evaluation',
          had_evaluation: Boolean(result.evaluation),
          language: args.language,
        });
      }
      return result;
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Abort,
    (_e, { sessionId }: { sessionId: string }): void => {
      const session = getSession(sessionId);
      const elapsed = session ? Math.round((Date.now() - session.startedAt) / 1000) : 0;
      endSession(sessionId);
      capture('interview_aborted', { elapsed_sec: elapsed });
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.List,
    (_e, { limit }: { limit?: number } = {}): InterviewSessionSummary[] => {
      return InterviewRepo.list(limit ?? 50);
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Stats,
    (): InterviewStatsBundle => InterviewRepo.aggregates()
  );

  ipcMain.handle(
    IpcChannels.Interview.Transcribe,
    async (_e, args: InterviewTranscribeArgs): Promise<InterviewTranscribeResult> => {
      const res = await transcribeAudio(new Uint8Array(args.audio), args.mimeType);
      if (!res.ok) return { ok: false, error: userFacingError(res.error) };
      return { ok: true, text: res.text };
    }
  );

  ipcMain.handle(
    IpcChannels.Interview.Speak,
    async (_e, args: InterviewSpeakArgs): Promise<InterviewSpeakResult> => {
      const res = await synthesizeSpeech(args.text, args.voice);
      if (!res.ok) {
        if ('message' in res.error && res.error.message.includes('model_terms_required')) {
          return {
            ok: false,
            error:
              'Groq needs a one-time terms acceptance for the Orpheus voice model. Accept them in the Groq console (playground, model canopylabs/orpheus-v1-english) and try again.',
          };
        }
        return { ok: false, error: userFacingError(res.error) };
      }
      // eslint-disable-next-line no-console
      console.log('[tts] synthesized', args.text.length, 'chars →', res.audio.byteLength, 'bytes');
      return { ok: true, audio: res.audio };
    }
  );
}
