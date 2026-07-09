import { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Volume2 } from 'lucide-react';
import {
  canSpeak,
  listEnglishVoices,
  setPreferredVoiceId,
  speak,
  stopSpeaking,
  type VoiceDescriptor,
} from './voice';

const GROQ_KEY = 'groq_api_key';
const VOICE_ID_KEY = 'interview_voice_id';

interface Props {
  open: boolean;
  initialValue?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ApiKeyDialog({ open, initialValue, onClose, onSaved }: Props) {
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionOk, setEncryptionOk] = useState<boolean | null>(null);

  const [voices, setVoices] = useState<VoiceDescriptor[]>([]);
  const [voiceId, setVoiceId] = useState<string>('');
  const [voicesLoading, setVoicesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue ?? '');
    setError(null);
    window.lv.settings.encryptionAvailable().then(setEncryptionOk);

    if (canSpeak()) {
      setVoicesLoading(true);
      void (async () => {
        const [list, saved] = await Promise.all([
          listEnglishVoices(),
          window.lv.settings.get(VOICE_ID_KEY),
        ]);
        setVoices(list);
        const fallback =
          list.find((v) => v.isDefault)?.id ?? list[0]?.id ?? '';
        setVoiceId(saved ?? fallback);
        setVoicesLoading(false);
      })();
    }
  }, [open, initialValue]);

  if (!open) return null;

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed.startsWith('gsk_') || trimmed.length < 20) {
      setError('Doesn\u2019t look like a Groq key (should start with "gsk_").');
      return;
    }
    setSaving(true);
    try {
      await window.lv.settings.set(GROQ_KEY, trimmed);
      if (voiceId) {
        await window.lv.settings.set(VOICE_ID_KEY, voiceId);
        setPreferredVoiceId(voiceId);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save key.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await window.lv.settings.clear(GROQ_KEY);
    setValue('');
    onSaved();
  };

  const onVoiceChange = async (id: string) => {
    setVoiceId(id);
    setPreferredVoiceId(id);
    await window.lv.settings.set(VOICE_ID_KEY, id);
  };

  const preview = () => {
    stopSpeaking();
    void speak(
      "Hi, I'll be your interviewer today. Let's take a look at the problem together."
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card-dim w-[460px] max-w-[92%] p-5">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold">Interview settings</h2>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-fg/[0.68]">
          The interview practice uses Groq (Llama 3.3 70B) for the live interviewer and
          evaluator. The free tier is plenty for personal use. Your key is stored encrypted in
          this device only.
        </p>

        <button
          type="button"
          onClick={() => window.lv.app.openExternal('https://console.groq.com/keys')}
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline"
        >
          Get a free key at console.groq.com <ExternalLink className="h-3 w-3" />
        </button>

        <input
          type="password"
          autoFocus
          placeholder="gsk_..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
          }}
          className="input mb-2 font-mono text-xs"
        />

        {encryptionOk === false ? (
          <p className="mb-2 text-[11px] text-status-inprogress">
            Warning: OS keychain unavailable. The key will be saved as plain text in the local
            database.
          </p>
        ) : null}

        {error ? <p className="mb-2 text-[11px] text-diff-hard">{error}</p> : null}

        {canSpeak() ? (
          <div className="mt-4 border-t border-glass-stroke/60 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-brand-400" />
              <h3 className="text-sm font-semibold">Interviewer voice</h3>
            </div>
            <p className="mb-2 text-[11px] leading-relaxed text-fg/[0.68]">
              Voices come from your operating system. Quality varies — try a few to find one
              that sounds natural. Local voices work offline; cloud voices need internet.
            </p>
            {voicesLoading ? (
              <p className="text-[11px] text-fg/[0.68]">Loading voices\u2026</p>
            ) : voices.length === 0 ? (
              <p className="text-[11px] text-status-inprogress">
                No English voices found on this system. Install additional voices via your OS
                settings (Windows: Settings \u2192 Time &amp; language \u2192 Speech; macOS:
                System Settings \u2192 Accessibility \u2192 Spoken Content; Linux: install
                <code className="mx-1 rounded bg-bg-300/60 px-1 py-0.5 font-mono">speech-dispatcher</code>
                with an English voice pack).
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={voiceId}
                  onChange={(e) => void onVoiceChange(e.target.value)}
                  className="input flex-1 text-xs"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.lang}){v.isLocal ? ' \u2022 local' : ''}
                      {v.isDefault ? ' \u2022 default' : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={preview}
                  className="btn h-9 px-3 text-xs text-fg/[0.68] hover:bg-fg/5"
                  title="Preview voice"
                >
                  Preview
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          {initialValue ? (
            <button
              type="button"
              onClick={remove}
              className="text-xs text-fg/[0.68] hover:text-diff-hard"
            >
              Remove key
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn text-fg/[0.68] hover:bg-fg/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !value.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const INTERVIEW_KEY_NAME = GROQ_KEY;
export const INTERVIEW_VOICE_ID_KEY = VOICE_ID_KEY;
