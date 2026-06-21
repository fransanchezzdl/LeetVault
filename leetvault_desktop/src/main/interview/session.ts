import { randomUUID } from 'node:crypto';
import { IpcChannels } from '@shared/ipc-channels';
import { broadcast } from '../events/bus';
import type {
  InterviewDifficulty,
  InterviewEvaluation,
  InterviewLanguage,
  InterviewMessage,
  InterviewProblem,
} from '@shared/types/interview';
import { chat, streamChat } from '../ai/groq';
import {
  buildEvaluatorMessages,
  buildInterviewerSystemPrompt,
  buildInterviewerUserTurn,
} from '../ai/prompts';
import { getProblemById, pickProblem } from './picker';
import { userFacingError } from '../ai/types';
import { evaluationFromJson } from './evaluation';
import { InterviewRepo } from '../db/interview.repo';

interface ActiveSession {
  id: string;
  problem: InterviewProblem;
  language: InterviewLanguage;
  startedAt: number;
  history: InterviewMessage[];
  abort?: AbortController;
  rowId?: number; // DB row id, written on finish
}

const sessions = new Map<string, ActiveSession>();

export function startSession(
  difficulty: InterviewDifficulty | 'unknown',
  language: InterviewLanguage
): { sessionId: string; problem: InterviewProblem } | null {
  const exclude = new Set<string>(InterviewRepo.recentProblemIds(5));
  const problem = pickProblem(difficulty, exclude);
  if (!problem) return null;
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    id: sessionId,
    problem,
    language,
    startedAt: Date.now(),
    history: [
      {
        role: 'system',
        text: buildInterviewerSystemPrompt(problem, language),
        ts: Date.now(),
      },
    ],
  });
  return { sessionId, problem };
}

export function getSession(id: string): ActiveSession | undefined {
  return sessions.get(id);
}

export function endSession(id: string): void {
  const s = sessions.get(id);
  if (!s) return;
  s.abort?.abort();
  sessions.delete(id);
}

/**
 * Kicks off the first interviewer turn (introducing the problem).
 * Streams via events:interview-stream; resolves once Groq is done or errored.
 */
export async function openingTurn(sessionId: string): Promise<void> {
  const s = sessions.get(sessionId);
  if (!s) return;
  const userPrompt =
    "Please introduce yourself in ONE short sentence as my interviewer, then present the problem using markdown. Structure it as: a single-line **bold title/summary**, a short paragraph describing the **input** and **output**, a short paragraph listing the **constraints** (sizes, value ranges, edge inputs), and AT LEAST ONE worked example as a fenced code block with the form:\n```\nInput:  ...\nOutput: ...\n```\nKeep paragraphs short and separated by blank lines. Do not give hints about the solution approach.";
  await runAssistantTurn(s, userPrompt);
}

export async function userMessage(
  sessionId: string,
  text: string,
  code: string | undefined,
  language: InterviewLanguage | undefined
): Promise<void> {
  const s = sessions.get(sessionId);
  if (!s) return;
  if (language) s.language = language;
  const userTurn = buildInterviewerUserTurn({
    text,
    code,
    language: s.language,
  });
  s.history.push({ role: 'user', text: userTurn, ts: Date.now() });
  await runAssistantTurn(s, undefined);
}

async function runAssistantTurn(
  s: ActiveSession,
  bootstrapUserPrompt: string | undefined
): Promise<void> {
  const abort = new AbortController();
  s.abort = abort;

  const messages = s.history.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.text,
  }));
  if (bootstrapUserPrompt) {
    messages.push({ role: 'user', content: bootstrapUserPrompt });
  }

  const result = await streamChat({
    messages,
    signal: abort.signal,
    temperature: 0.7,
    maxTokens: 700,
    onDelta(delta) {
      broadcast(IpcChannels.Events.InterviewStream, {
        sessionId: s.id,
        delta,
        done: false,
      });
    },
  });

  if (!result.ok) {
    broadcast(IpcChannels.Events.InterviewStream, {
      sessionId: s.id,
      delta: '',
      done: true,
      error: userFacingError(result.error),
    });
    return;
  }

  s.history.push({ role: 'assistant', text: result.full, ts: Date.now() });
  broadcast(IpcChannels.Events.InterviewStream, {
    sessionId: s.id,
    delta: '',
    done: true,
  });
  broadcast(IpcChannels.Events.InterviewMessage, {
    sessionId: s.id,
    role: 'assistant',
    text: result.full,
  });
}

export interface FinishResult {
  evaluation: InterviewEvaluation | null;
  evaluationRaw?: string;
  problemFull: InterviewProblem;
}

export async function finishSession(
  sessionId: string,
  finalCode: string,
  language: InterviewLanguage,
  durationSec: number
): Promise<FinishResult | null> {
  const s = sessions.get(sessionId);
  if (!s) return null;

  const { system, user } = buildEvaluatorMessages(
    s.problem,
    language,
    durationSec,
    finalCode,
    s.history
  );

  const res = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.2, maxTokens: 1200, responseFormat: 'json_object' }
  );

  let evaluation: InterviewEvaluation | null = null;
  let raw: string | undefined;
  if (res.ok) {
    raw = res.text;
    evaluation = evaluationFromJson(res.text);
  } else {
    raw = userFacingError(res.error);
  }

  // Persist
  try {
    const rowId = InterviewRepo.insert({
      problemId: s.problem.id,
      difficulty: s.problem.difficulty,
      language,
      durationSec,
      finalCode,
      evaluationJson: evaluation ? JSON.stringify(evaluation) : raw ?? null,
      startedAt: new Date(s.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
    });
    s.rowId = rowId;
  } catch {
    // Persistence failure shouldn't crash the finish flow.
  }

  sessions.delete(sessionId);

  return {
    evaluation,
    evaluationRaw: raw,
    problemFull: s.problem,
  };
}

export function lookupProblem(id: string): InterviewProblem | undefined {
  return getProblemById(id);
}
