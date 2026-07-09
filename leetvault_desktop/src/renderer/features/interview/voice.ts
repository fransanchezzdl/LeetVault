/**
 * Voice helpers for the interview: mic recording transcribed through Groq
 * Whisper (Chromium's Web Speech STT needs a Google API key that Electron
 * builds lack, so it can never work here), and interviewer speech synthesized
 * through Groq Orpheus TTS (English voices).
 */

export function canRecord(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function canSpeak(): boolean {
  return typeof Audio !== 'undefined';
}

export interface RecorderHandle {
  /** Stops recording and kicks off transcription. */
  stop: () => void;
  /** Stops recording and discards the audio without transcribing. */
  cancel: () => void;
}

function pickAudioMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

/**
 * Records mic audio until `stop()` is called, then transcribes it via the
 * main process (Groq Whisper). `onTranscribing` fires when recording ends and
 * the network round-trip begins; `onFinal` receives the English transcript.
 * Errors surface via `onError` with a user-readable message.
 */
export async function startRecording(opts: {
  onFinal: (text: string) => void;
  onTranscribing?: () => void;
  onError?: (message: string) => void;
}): Promise<RecorderHandle | null> {
  if (!canRecord()) return null;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    opts.onError?.(
      e instanceof DOMException && e.name === 'NotAllowedError'
        ? 'Microphone access was denied.'
        : 'Could not access the microphone.'
    );
    return null;
  }

  const mimeType = pickAudioMime();
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  let cancelled = false;

  rec.ondataavailable = (ev: BlobEvent): void => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  rec.onstop = (): void => {
    stream.getTracks().forEach((t) => t.stop());
    if (cancelled) return;
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
    if (blob.size === 0) {
      opts.onError?.('No audio was captured.');
      return;
    }
    opts.onTranscribing?.();
    void (async () => {
      try {
        const audio = await blob.arrayBuffer();
        const res = await window.lv.interview.transcribe({ audio, mimeType: blob.type });
        if (!res.ok) {
          opts.onError?.(res.error);
          return;
        }
        if (!res.text) {
          opts.onError?.('No speech detected.');
          return;
        }
        opts.onFinal(res.text);
      } catch (e) {
        opts.onError?.(e instanceof Error ? e.message : 'Transcription failed.');
      }
    })();
  };

  try {
    rec.start();
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    opts.onError?.(e instanceof Error ? e.message : 'Recording failed to start.');
    return null;
  }

  return {
    stop: () => {
      if (rec.state !== 'inactive') rec.stop();
    },
    cancel: () => {
      cancelled = true;
      if (rec.state !== 'inactive') rec.stop();
    },
  };
}

export const ORPHEUS_VOICES = [
  { id: 'troy', name: 'Troy' },
  { id: 'austin', name: 'Austin' },
  { id: 'daniel', name: 'Daniel' },
  { id: 'autumn', name: 'Autumn' },
  { id: 'diana', name: 'Diana' },
  { id: 'hannah', name: 'Hannah' },
] as const;

export const DEFAULT_VOICE_ID = 'troy';
/** OS speechSynthesis voice — offline and robotic, but free and unlimited. */
export const SYSTEM_VOICE_ID = 'system';

// The chosen voice id is set externally (from a settings load) so speak()
// never needs an extra settings read on the hot path.
let preferredVoiceId: string = DEFAULT_VOICE_ID;

export function setPreferredVoiceId(id: string | null): void {
  const trimmed = id?.trim().toLowerCase() ?? '';
  preferredVoiceId =
    trimmed === SYSTEM_VOICE_ID || ORPHEUS_VOICES.some((v) => v.id === trimmed)
      ? trimmed
      : DEFAULT_VOICE_ID;
}

/** Markdown is great for visual rendering but TTS spells out stars and hashes
 * as words. Strip the most common markdown noise before handing to the synth. */
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^[-*+]\s+/gm, '') // bullets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Orpheus rejects inputs over ~200 chars, so split on sentence boundaries and
// pack sentences into chunks under the limit (word-splitting monster sentences).
const TTS_CHUNK_MAX = 190;

function chunkForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let cur = '';
  const push = (): void => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = '';
  };
  for (const sentence of sentences) {
    if ((cur + sentence).length <= TTS_CHUNK_MAX) {
      cur += sentence;
      continue;
    }
    push();
    if (sentence.length <= TTS_CHUNK_MAX) {
      cur = sentence;
      continue;
    }
    for (const word of sentence.split(/\s+/)) {
      if ((cur + ' ' + word).trim().length > TTS_CHUNK_MAX) push();
      cur = cur ? `${cur} ${word}` : word;
    }
  }
  push();
  return chunks;
}

// Generation counter cancels any in-flight speech when a new speak()/stop
// arrives, so consecutive assistant messages never overlap.
let ttsGeneration = 0;
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

type ChunkResult = { audio: ArrayBuffer } | { error: string };

async function fetchChunkAudio(text: string): Promise<ChunkResult> {
  try {
    const res = await window.lv.interview.speak({ text, voice: preferredVoiceId });
    if (!res.ok) return { error: res.error };
    return { audio: res.audio };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Speech synthesis failed.' };
  }
}

/** Resolves true if the chunk played (or was cancelled), false on playback failure. */
async function playWav(buf: ArrayBuffer, gen: number): Promise<boolean> {
  if (gen !== ttsGeneration) return true;
  if (buf.byteLength === 0) {
    // eslint-disable-next-line no-console
    console.warn('[tts] empty audio buffer');
    return false;
  }
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    // decodeAudioData detaches its input, so hand it a copy.
    const decoded = await audioCtx.decodeAudioData(buf.slice(0));
    if (gen !== ttsGeneration) return true;
    return await new Promise<boolean>((resolve) => {
      const src = audioCtx!.createBufferSource();
      src.buffer = decoded;
      src.connect(audioCtx!.destination);
      currentSource = src;
      src.onended = () => {
        if (currentSource === src) currentSource = null;
        resolve(true);
      };
      src.start();
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[tts] playback failed', e);
    return false;
  }
}

function canSpeakSystem(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function loadSystemVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(synth.getVoices()), 1500);
    synth.onvoiceschanged = () => {
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
  });
}

// Chromium silently cuts off long utterances, so system speech reuses the same
// sentence chunking as Orpheus and queues one utterance per chunk. The small
// delay before the first utterance dodges a Chromium quirk where an utterance
// scheduled in the same tick as cancel() is silently dropped.
async function speakWithSystem(text: string, gen: number): Promise<void> {
  if (!canSpeakSystem()) return;
  const voices = await loadSystemVoices();
  const voice =
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0] ?? null;
  await new Promise((r) => setTimeout(r, 50));
  for (const chunk of chunkForSpeech(text)) {
    if (gen !== ttsGeneration) return;
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = (ev) => {
        // eslint-disable-next-line no-console
        console.warn('[tts:system]', ev.error ?? '(unknown)');
        resolve();
      };
      window.speechSynthesis.speak(u);
    });
  }
}

/**
 * Speaks `text` with the interviewer's Groq (Orpheus) voice, or the OS voice
 * when selected. Long messages are synthesized in sentence chunks, prefetching
 * the next chunk while the current one plays. If Orpheus synthesis fails the
 * remaining text falls back to the system voice (when available) and `onError`
 * receives a user-readable notice — the interview always continues as text.
 */
export async function speak(
  text: string,
  onError?: (message: string) => void
): Promise<void> {
  const clean = stripMarkdownForSpeech(text);
  if (!clean) return;
  stopSpeaking();
  const gen = ttsGeneration;
  if (preferredVoiceId === SYSTEM_VOICE_ID) {
    await speakWithSystem(clean, gen);
    return;
  }
  const chunks = chunkForSpeech(clean);
  let next: Promise<ChunkResult | null> = fetchChunkAudio(chunks[0]);
  for (let i = 0; i < chunks.length; i++) {
    const res = await next;
    if (gen !== ttsGeneration) return;
    next = i + 1 < chunks.length ? fetchChunkAudio(chunks[i + 1]) : Promise.resolve(null);
    if (!res) return;
    if ('error' in res) {
      // eslint-disable-next-line no-console
      console.warn('[tts]', res.error);
      if (canSpeakSystem()) {
        onError?.(`Groq voice failed (${res.error}) — using the system voice instead.`);
        await speakWithSystem(chunks.slice(i).join(' '), gen);
      } else {
        onError?.(res.error);
      }
      return;
    }
    const played = await playWav(res.audio, gen);
    if (gen !== ttsGeneration) return;
    if (!played) {
      if (canSpeakSystem()) {
        onError?.('Audio playback failed — using the system voice instead.');
        await speakWithSystem(chunks.slice(i).join(' '), gen);
      } else {
        onError?.('Audio playback failed.');
      }
      return;
    }
  }
}

export function stopSpeaking(): void {
  ttsGeneration++;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // already stopped
    }
    currentSource = null;
  }
  if (canSpeakSystem()) window.speechSynthesis.cancel();
}
