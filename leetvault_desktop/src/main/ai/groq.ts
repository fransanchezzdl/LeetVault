import { createParser, type EventSourceMessage } from 'eventsource-parser';
import { SettingsRepo } from '../db/settings.repo';
import {
  GROQ_BASE_URL,
  GROQ_MODEL,
  GROQ_STT_MODEL,
  GROQ_TTS_MODEL,
  type GroqError,
  type GroqMessage,
} from './types';

const GROQ_KEY = 'groq_api_key';
const OVERALL_TIMEOUT_MS = 30_000;
const IDLE_TIMEOUT_MS = 8_000;

export interface StreamChatArgs {
  messages: GroqMessage[];
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface StreamChatResult {
  ok: true;
  full: string;
}

export interface StreamChatFailure {
  ok: false;
  error: GroqError;
}

export async function streamChat(
  args: StreamChatArgs
): Promise<StreamChatResult | StreamChatFailure> {
  const key = SettingsRepo.get(GROQ_KEY);
  if (!key) return { ok: false, error: { kind: 'missing_key' } };

  const ctrl = new AbortController();
  const onAbort = (): void => ctrl.abort();
  args.signal?.addEventListener('abort', onAbort, { once: true });

  const overallTimer = setTimeout(() => ctrl.abort(), OVERALL_TIMEOUT_MS);
  let idleTimer: NodeJS.Timeout | null = null;
  const resetIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => ctrl.abort(), IDLE_TIMEOUT_MS);
  };
  resetIdle();

  try {
    const res = await fetchWithRetry(key, args, ctrl.signal);
    if ('error' in res) return { ok: false, error: res.error };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    const parser = createParser({
      onEvent(ev: EventSourceMessage) {
        if (!ev.data || ev.data === '[DONE]') return;
        try {
          const json = JSON.parse(ev.data) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            args.onDelta(delta);
          }
        } catch {
          // Ignore malformed chunks; Groq is consistent in practice.
        }
      },
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetIdle();
      parser.feed(decoder.decode(value, { stream: true }));
    }

    return { ok: true, full };
  } catch (err) {
    if (ctrl.signal.aborted) return { ok: false, error: { kind: 'aborted' } };
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { kind: 'network', message: msg } };
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    clearTimeout(overallTimer);
    args.signal?.removeEventListener('abort', onAbort);
  }
}

async function fetchWithRetry(
  key: string,
  args: StreamChatArgs,
  signal: AbortSignal
): Promise<{ body: ReadableStream<Uint8Array> } | { error: GroqError }> {
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        stream: true,
        temperature: args.temperature ?? 0.7,
        max_tokens: args.maxTokens ?? 1024,
        messages: args.messages,
        ...(args.responseFormat === 'json_object'
          ? { response_format: { type: 'json_object' } }
          : {}),
      }),
    }).catch((e: unknown) => {
      throw e;
    });

    if (res.ok && res.body) {
      return { body: res.body };
    }

    const text = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      return { error: { kind: 'auth', message: text || `${res.status}` } };
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt < 2) {
        await delay(800);
        continue;
      }
      const kind = res.status === 429 ? 'rate_limit' : 'server';
      return { error: { kind, message: text || `${res.status}` } };
    }
    return { error: { kind: 'server', message: text || `${res.status}` } };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Single-shot non-streaming call. Convenience wrapper around streamChat. */
export async function chat(
  messages: GroqMessage[],
  opts: Omit<StreamChatArgs, 'messages' | 'onDelta'> = {}
): Promise<{ ok: true; text: string } | { ok: false; error: GroqError }> {
  const buf: string[] = [];
  const res = await streamChat({ ...opts, messages, onDelta: (c) => buf.push(c) });
  if (!res.ok) return res;
  return { ok: true, text: res.full };
}

/** Transcribes recorded audio to English text via Groq Whisper. */
export async function transcribeAudio(
  audio: Uint8Array<ArrayBuffer>,
  mimeType: string
): Promise<{ ok: true; text: string } | { ok: false; error: GroqError }> {
  const key = SettingsRepo.get(GROQ_KEY);
  if (!key) return { ok: false, error: { kind: 'missing_key' } };

  const form = new FormData();
  const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
  form.append('file', new Blob([audio], { type: mimeType }), `speech.${ext}`);
  form.append('model', GROQ_STT_MODEL);
  form.append('language', 'en');
  form.append('response_format', 'json');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OVERALL_TIMEOUT_MS);
  try {
    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: { kind: 'auth', message: text || `${res.status}` } };
      }
      if (res.status === 429) {
        return { ok: false, error: { kind: 'rate_limit', message: text || `${res.status}` } };
      }
      return { ok: false, error: { kind: 'server', message: text || `${res.status}` } };
    }
    const json = (await res.json()) as { text?: string };
    return { ok: true, text: (json.text ?? '').trim() };
  } catch (err) {
    if (ctrl.signal.aborted) return { ok: false, error: { kind: 'aborted' } };
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { kind: 'network', message: msg } };
  } finally {
    clearTimeout(timer);
  }
}

/** Synthesizes speech (WAV) for a short text chunk via Groq Orpheus TTS. */
export async function synthesizeSpeech(
  text: string,
  voice: string
): Promise<{ ok: true; audio: ArrayBuffer } | { ok: false; error: GroqError }> {
  const key = SettingsRepo.get(GROQ_KEY);
  if (!key) return { ok: false, error: { kind: 'missing_key' } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OVERALL_TIMEOUT_MS);
  try {
    const res = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_TTS_MODEL,
        input: text,
        voice,
        response_format: 'wav',
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: { kind: 'auth', message: body || `${res.status}` } };
      }
      if (res.status === 429) {
        return { ok: false, error: { kind: 'rate_limit', message: body || `${res.status}` } };
      }
      return { ok: false, error: { kind: 'server', message: body || `${res.status}` } };
    }
    const audio = await res.arrayBuffer();
    return { ok: true, audio };
  } catch (err) {
    if (ctrl.signal.aborted) return { ok: false, error: { kind: 'aborted' } };
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { kind: 'network', message: msg } };
  } finally {
    clearTimeout(timer);
  }
}
