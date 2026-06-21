import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';
import {
  ApiKeyDialog,
  INTERVIEW_KEY_NAME,
  INTERVIEW_VOICE_ID_KEY,
} from './ApiKeyDialog';
import { SetupPanel } from './SetupPanel';
import { LivePanel } from './LivePanel';
import { EvaluationPanel } from './EvaluationPanel';
import { useInterview } from './store';
import { setPreferredVoiceId } from './voice';

const VOICE_PREF_KEY = 'interview_tts_enabled';

export function InterviewView() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | undefined>(undefined);

  const phase = useInterview((s) => s.phase);
  const setTtsEnabled = useInterview((s) => s.setTtsEnabled);

  // Load persisted TTS pref + preferred voice once when the Interview view
  // mounts so the very first interviewer message (the opening turn) is read
  // aloud with the right voice if enabled.
  useEffect(() => {
    void (async () => {
      const [ttsPref, voiceId] = await Promise.all([
        window.lv.settings.get(VOICE_PREF_KEY),
        window.lv.settings.get(INTERVIEW_VOICE_ID_KEY),
      ]);
      if (voiceId) setPreferredVoiceId(voiceId);
      if (ttsPref === '1') setTtsEnabled(true);
    })();
  }, [setTtsEnabled]);

  const refresh = async () => {
    const has = await window.lv.settings.has(INTERVIEW_KEY_NAME);
    setHasKey(has);
    if (has) {
      const v = await window.lv.settings.get(INTERVIEW_KEY_NAME);
      setCurrentKey(v ?? undefined);
    } else {
      setCurrentKey(undefined);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (hasKey === false) setDialogOpen(true);
  }, [hasKey]);

  if (hasKey === null) {
    return <div className="p-6 text-sm text-fgMuted">Cargando…</div>;
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-glass-stroke/60 px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-brand-400" />
            Live Coding Interview
          </h1>
          <p className="mt-0.5 text-xs text-fgMuted">
            Practice with an AI interviewer in English — chat, code, get scored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="btn text-fgMuted hover:bg-white/5"
          title="Manage Groq API key"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {!hasKey ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="glass-card-dim max-w-md p-6 text-center">
              <p className="text-sm text-fgSoft">
                Add your Groq API key to unlock interview practice.
              </p>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="btn-primary mt-4"
              >
                Add API key
              </button>
            </div>
          </div>
        ) : phase === 'setup' ? (
          <SetupPanel />
        ) : phase === 'live' ? (
          <LivePanel />
        ) : (
          <EvaluationPanel />
        )}
      </div>

      <ApiKeyDialog
        open={dialogOpen}
        initialValue={currentKey}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          void refresh();
        }}
      />
    </div>
  );
}
