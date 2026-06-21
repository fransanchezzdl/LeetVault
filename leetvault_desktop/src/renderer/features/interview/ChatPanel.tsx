import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useInterview } from './store';
import {
  canRecord,
  canSpeak,
  startRecognizing,
  stopSpeaking,
  type RecognizerHandle,
} from './voice';

const VOICE_PREF_KEY = 'interview_tts_enabled';

export function ChatPanel(): JSX.Element {
  const sessionId = useInterview((s) => s.sessionId);
  const messages = useInterview((s) => s.messages);
  const sending = useInterview((s) => s.sending);
  const code = useInterview((s) => s.code);
  const language = useInterview((s) => s.language);
  const pushUser = useInterview((s) => s.pushUser);
  const setSending = useInterview((s) => s.setSending);
  const streamError = useInterview((s) => s.streamError);
  const ttsEnabled = useInterview((s) => s.ttsEnabled);
  const setTtsEnabled = useInterview((s) => s.setTtsEnabled);

  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<RecognizerHandle | null>(null);

  const recordSupported = canRecord();
  const speakSupported = canSpeak();

  // Auto-scroll to bottom on new messages or deltas
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;
    setInput('');
    pushUser(text);
    setSending(true);
    try {
      await window.lv.interview.send({
        sessionId,
        text,
        code: code || undefined,
        language,
      });
    } catch (e) {
      useInterview
        .getState()
        .setStreamError(e instanceof Error ? e.message : 'Failed to send');
      setSending(false);
    }
  };

  const toggleListen = (): void => {
    setVoiceError(null);
    if (listening) {
      recRef.current?.stop();
      recRef.current = null;
      setListening(false);
      return;
    }
    const handle = startRecognizing({
      onInterim: (t) => setInput(t),
      onFinal: (t) => {
        setInput(t);
        recRef.current = null;
        setListening(false);
      },
      onError: (code) => {
        setVoiceError(`Mic: ${code}`);
        recRef.current = null;
        setListening(false);
      },
    });
    if (!handle) {
      setVoiceError('Speech recognition is unavailable on this system.');
      return;
    }
    recRef.current = handle;
    setListening(true);
  };

  const toggleTts = (): void => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    void window.lv.settings.set(VOICE_PREF_KEY, next ? '1' : '0');
    if (!next) stopSpeaking();
  };

  // Clean up active mic on unmount
  useEffect(() => {
    return () => {
      recRef.current?.stop();
      recRef.current = null;
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollerRef}
        className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <div className="text-xs text-fgMuted">
            The interviewer will introduce the problem in a moment…
          </div>
        ) : null}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} streaming={m.streaming} />
        ))}
        {streamError ? (
          <div className="rounded-lg border border-diff-hard/40 bg-diff-hard/10 px-3 py-2 text-xs text-diff-hard">
            {streamError}
          </div>
        ) : null}
      </div>
      <div className="border-t border-glass-stroke/60 p-3">
        {(recordSupported || speakSupported) ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {recordSupported ? (
              <button
                type="button"
                onClick={toggleListen}
                disabled={sending}
                className={
                  'btn h-8 px-2 ' +
                  (listening
                    ? 'bg-diff-hard/20 text-diff-hard hover:bg-diff-hard/30'
                    : 'text-fgMuted hover:bg-white/5')
                }
                title={listening ? 'Stop listening' : 'Speak (English)'}
              >
                {listening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            ) : null}
            {speakSupported ? (
              <button
                type="button"
                onClick={toggleTts}
                className={
                  'btn h-8 px-2 ' +
                  (ttsEnabled
                    ? 'bg-brand-500/15 text-brand-400 hover:bg-brand-500/25'
                    : 'text-fgMuted hover:bg-white/5')
                }
                title={
                  ttsEnabled ? 'Stop reading replies aloud' : 'Read replies aloud'
                }
              >
                {ttsEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              listening
                ? 'Listening… speak in English'
                : 'Ask a clarifying question, walk through your approach…'
            }
            rows={2}
            className="input min-h-[2.5rem] min-w-0 flex-1 resize-none py-2"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="btn-primary inline-flex h-9 shrink-0 items-center gap-1.5 px-3 disabled:opacity-50"
            title="Send (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-fgMuted">
          <span>Enter to send · Shift+Enter for newline · English only</span>
          {voiceError ? <span className="text-diff-hard">{voiceError}</span> : null}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  text,
  streaming,
}: {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}): JSX.Element {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
          (isUser
            ? 'glass-card-dim whitespace-pre-wrap text-fgSoft'
            : 'border border-brand-500/20 bg-brand-500/10 text-fg')
        }
      >
        {isUser ? (
          text || (streaming ? <Dots /> : '')
        ) : text ? (
          <AssistantMarkdown text={text} streaming={streaming} />
        ) : streaming ? (
          <Dots />
        ) : null}
      </div>
    </div>
  );
}

function AssistantMarkdown({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}): JSX.Element {
  return (
    <div className="chat-md">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-brand-200">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-fgSoft">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          code: ({ className, children, ...rest }) => {
            const isInline = !className || !className.startsWith('language-');
            if (isInline) {
              return (
                <code
                  className="rounded bg-bg-300/60 px-1 py-0.5 font-mono text-[0.8125rem] text-brand-200"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-[0.8125rem]" {...rest}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-md border border-glass-stroke bg-bg-300/70 p-2.5 text-fgSoft">
              {children}
            </pre>
          ),
          h1: ({ children }) => <p className="my-1.5 font-semibold text-brand-200">{children}</p>,
          h2: ({ children }) => <p className="my-1.5 font-semibold text-brand-200">{children}</p>,
          h3: ({ children }) => <p className="my-1.5 font-semibold text-brand-200">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} className="text-brand-300 underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
      {streaming ? <span className="ml-1 animate-pulse">▍</span> : null}
    </div>
  );
}

function Dots(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fgMuted" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fgMuted [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fgMuted [animation-delay:240ms]" />
    </span>
  );
}
