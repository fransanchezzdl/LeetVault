import { useState } from 'react';
import { Clock, Flag, Square } from 'lucide-react';
import type { InterviewLanguage } from '@shared/types/interview';
import { Select, SelectOption } from '../../components/ui/Select';
import { useInterview } from './store';
import { formatMmSs } from './hooks';

const LANGUAGE_LABELS: Record<InterviewLanguage, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  go: 'Go',
};

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy: 'bg-diff-easy/15 text-diff-easy border-diff-easy/40',
  Medium: 'bg-diff-medium/15 text-diff-medium border-diff-medium/40',
  Hard: 'bg-diff-hard/15 text-diff-hard border-diff-hard/40',
};

interface Props {
  onFinish: () => void;
  onAbort: () => void;
}

export function HeaderBar({ onFinish, onAbort }: Props): JSX.Element {
  const problemPublic = useInterview((s) => s.problemPublic);
  const language = useInterview((s) => s.language);
  const setLanguage = useInterview((s) => s.setLanguage);
  const code = useInterview((s) => s.code);
  const timerRemaining = useInterview((s) => s.timerRemainingSec);
  const startedAt = useInterview((s) => s.startedAt);
  const editorReady = useInterview((s) => s.editorReady);
  const finishing = useInterview((s) => s.finishing);

  const [showLangWarn, setShowLangWarn] = useState<InterviewLanguage | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);

  const elapsedSec = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const timerLow = timerRemaining != null && timerRemaining <= 300;

  const handleLangPick = (next: string): void => {
    const lang = next as InterviewLanguage;
    if (lang === language) return;
    if (code.trim().length > 0) {
      setShowLangWarn(lang);
    } else {
      setLanguage(lang);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-stroke/60 px-5 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-fgMuted">
        {problemPublic ? (
          <span
            className={
              'rounded-full border px-2 py-0.5 text-[11px] font-medium ' +
              (DIFFICULTY_STYLE[problemPublic.difficulty] ??
                'border-glass-stroke bg-bg-200/40')
            }
          >
            {problemPublic.difficulty}
          </span>
        ) : null}
        <span className="truncate text-sm font-semibold text-fg">
          {problemPublic?.title ?? '…'}
        </span>
        {problemPublic?.topics?.length ? (
          <span className="hidden truncate text-fgMuted/80 sm:inline">
            · {problemPublic.topics.slice(0, 3).join(' · ')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!editorReady ? (
          <span className="rounded-md bg-bg-200/40 px-2 py-1 text-[10px] uppercase tracking-wide text-fgMuted">
            Editor loading
          </span>
        ) : null}

        {timerRemaining != null ? (
          <div
            className={
              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium tabular-nums ' +
              (timerLow
                ? 'animate-pulse bg-diff-hard/15 text-diff-hard'
                : 'bg-bg-200/40 text-fgSoft')
            }
            title="Time remaining"
          >
            <Clock className="h-3.5 w-3.5" />
            {formatMmSs(Math.max(0, timerRemaining))}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-bg-200/40 px-2 py-1 text-sm text-fgMuted">
            <Clock className="h-3.5 w-3.5" /> {formatMmSs(elapsedSec)}
          </div>
        )}

        <Select
          value={language}
          onValueChange={handleLangPick}
          className="h-8 w-[8.5rem] text-xs"
          aria-label="Coding language"
        >
          {(Object.keys(LANGUAGE_LABELS) as InterviewLanguage[]).map((k) => (
            <SelectOption key={k} value={k}>
              {LANGUAGE_LABELS[k]}
            </SelectOption>
          ))}
        </Select>

        <button
          type="button"
          onClick={() => setConfirmAbort(true)}
          className="btn h-8 text-xs text-fgMuted hover:bg-white/5"
          title="Abandon session"
        >
          <Square className="mr-1 h-3.5 w-3.5" /> Abort
        </button>

        <button
          type="button"
          onClick={() => {
            if (elapsedSec > 600) setConfirmFinish(true);
            else onFinish();
          }}
          disabled={finishing}
          className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-50"
        >
          <Flag className="h-3.5 w-3.5" /> {finishing ? 'Evaluating…' : 'Finish'}
        </button>
      </div>

      {showLangWarn ? (
        <ConfirmModal
          title="Change language?"
          body="Your current code stays in the editor but the language tag will change. Continue?"
          onConfirm={() => {
            setLanguage(showLangWarn);
            setShowLangWarn(null);
          }}
          onCancel={() => setShowLangWarn(null)}
        />
      ) : null}

      {confirmFinish ? (
        <ConfirmModal
          title="Finish interview?"
          body="The AI will evaluate your performance now. This cannot be undone."
          onConfirm={() => {
            setConfirmFinish(false);
            onFinish();
          }}
          onCancel={() => setConfirmFinish(false)}
        />
      ) : null}

      {confirmAbort ? (
        <ConfirmModal
          title="Abandon session?"
          body="No evaluation will be generated. You'll return to setup."
          onConfirm={() => {
            setConfirmAbort(false);
            onAbort();
          }}
          onCancel={() => setConfirmAbort(false)}
          danger
        />
      ) : null}
    </header>
  );
}

function ConfirmModal(props: {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-card-dim w-full max-w-sm p-5">
        <h3 className="text-sm font-semibold">{props.title}</h3>
        <p className="mt-2 text-xs text-fgMuted">{props.body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="btn text-fgMuted hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className={props.danger ? 'btn-danger' : 'btn-primary'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
