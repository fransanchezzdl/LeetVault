/**
 * Thin Web Speech API wrappers, locked to English (en-US) for both STT and TTS.
 * Capability checks let UI hide controls gracefully on platforms where Chromium
 * lacks the network endpoint (some Linux builds).
 */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  results: Array<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
  resultIndex: number;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecord(): boolean {
  return getRecognitionCtor() !== null;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface RecognizerHandle {
  stop: () => void;
}

/**
 * Starts a one-shot English recognizer. Calls `onInterim` on each partial
 * result, `onFinal` once when the user stops speaking. Returns a handle to stop
 * early. Errors surface via `onError` with the raw browser code (e.g. 'no-speech',
 * 'audio-capture', 'network').
 */
export function startRecognizing(opts: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (code: string) => void;
}): RecognizerHandle | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true;

  let finalBuf = '';

  rec.onresult = (ev: SpeechRecognitionEventLike): void => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      const t = r[0]?.transcript ?? '';
      if (r.isFinal) finalBuf += t;
      else interim += t;
    }
    if (interim && opts.onInterim) opts.onInterim((finalBuf + interim).trim());
  };

  rec.onerror = (ev): void => {
    opts.onError?.(ev.error ?? 'unknown');
  };

  rec.onend = (): void => {
    const text = finalBuf.trim();
    if (text) opts.onFinal(text);
  };

  try {
    rec.start();
  } catch (e) {
    opts.onError?.(e instanceof Error ? e.message : 'start-failed');
    return null;
  }

  return { stop: () => rec.stop() };
}

// Chromium populates SpeechSynthesis voices asynchronously — the first
// getVoices() call right after page load usually returns []. We memoize a
// promise that resolves once voices are available (or after a fallback delay).
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!canSpeak()) return Promise.resolve([]);
  if (voicesReady) return voicesReady;
  const synth = window.speechSynthesis;
  voicesReady = new Promise((resolve) => {
    const initial = synth.getVoices();
    if (initial.length > 0) {
      resolve(initial);
      return;
    }
    const handler = (): void => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', handler);
    // Some Linux builds never fire the event; resolve after a second so we at
    // least try to speak with the platform default voice.
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(synth.getVoices());
    }, 1200);
  });
  return voicesReady;
}

export interface VoiceDescriptor {
  /** Stable identifier — use `voiceURI` when present, otherwise the display name. */
  id: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isLocal: boolean;
}

/** Lists available English voices the user can choose from. */
export async function listEnglishVoices(): Promise<VoiceDescriptor[]> {
  const voices = await ensureVoices();
  return voices
    .filter((v) => v.lang?.toLowerCase().startsWith('en'))
    .map((v) => ({
      id: v.voiceURI || v.name,
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      isLocal: v.localService,
    }))
    .sort((a, b) => {
      // Prefer local voices first (faster + offline), then alphabetical.
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

// The chosen voice id is set externally (from a settings load) so speak()
// never needs to make an IPC call on the hot path.
let preferredVoiceId: string | null = null;

export function setPreferredVoiceId(id: string | null): void {
  preferredVoiceId = id?.trim() || null;
}

/** Markdown is great for visual rendering but TTS spells out stars and hashes
 * as words. Strip the most common markdown noise before handing to the synth. */
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block omitted. ') // fenced code
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^[-*+]\s+/gm, '') // bullets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Speaks `text` using the user's preferred English voice (or the first
 * available English voice if none is set). No-op if TTS is unavailable or
 * `text` is empty. Awaits the voice list so the very first call after page
 * load actually plays.
 */
export async function speak(text: string): Promise<void> {
  if (!canSpeak()) return;
  const clean = stripMarkdownForSpeech(text);
  if (!clean) return;
  const synth = window.speechSynthesis;
  await ensureVoices();
  // Cancel any in-flight utterance so consecutive assistant messages don't
  // overlap. A small delay before the next speak() dodges a Chromium quirk
  // where the new utterance gets dropped if scheduled in the same tick.
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'en-US';
  u.rate = 1.0;
  u.pitch = 1.0;
  const voice = pickVoice(synth.getVoices());
  if (voice) u.voice = voice;
  u.onerror = (ev): void => {
    // eslint-disable-next-line no-console
    console.warn('[tts] utterance error', ev.error ?? '(unknown)');
  };
  setTimeout(() => synth.speak(u), 40);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

function pickVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  if (preferredVoiceId) {
    const match = voices.find(
      (v) => v.voiceURI === preferredVoiceId || v.name === preferredVoiceId
    );
    if (match) return match;
  }
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  return en[0] ?? voices[0] ?? null;
}
