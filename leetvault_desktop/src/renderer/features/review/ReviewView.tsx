import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import type { Problem } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';
import { Button } from '../../components/ui/Button';
import { DifficultyBadge } from '../../components/badges/Badges';
import { cn } from '../../lib/cn';
import {
  useDueReviews,
  useFinishReview,
  useNextReviewDate,
  useRateReview,
} from './hooks';

const QUALITIES: { q: Quality; label: string; tone: string }[] = [
  { q: 0, label: 'Blackout', tone: 'bg-diff-hard/20 text-diff-hard hover:bg-diff-hard/30' },
  { q: 2, label: 'Difícil', tone: 'bg-status-inprogress/20 text-status-inprogress hover:bg-status-inprogress/30' },
  { q: 3, label: 'Bien', tone: 'bg-diff-medium/20 text-diff-medium hover:bg-diff-medium/30' },
  { q: 4, label: 'Fácil', tone: 'bg-diff-easy/20 text-diff-easy hover:bg-diff-easy/30' },
  { q: 5, label: 'Perfecto', tone: 'bg-status-solved/20 text-status-solved hover:bg-status-solved/30' },
];

export function ReviewView() {
  const { data: due = [], isLoading } = useDueReviews();
  const { data: nextDate } = useNextReviewDate();
  const { mutate: rate, isPending: rating } = useRateReview();
  const { mutate: finish, isPending: finishing } = useFinishReview();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [keepRevising, setKeepRevising] = useState(true);

  useEffect(() => {
    if (index >= due.length) setIndex(0);
  }, [due.length, index]);

  const current = due[index];
  const isPending = rating || finishing;

  const advance = () => {
    setRevealed(false);
    setKeepRevising(true);
    setIndex((i) => i + 1);
  };

  const handleRate = (q: Quality) => {
    if (!current) return;
    rate({ id: current.id, quality: q }, { onSuccess: advance });
  };

  const handleFinish = () => {
    if (!current) return;
    finish(current.id, { onSuccess: advance });
  };

  if (isLoading) {
    return <Centered>Cargando repaso…</Centered>;
  }

  if (due.length === 0 || index >= due.length) {
    return (
      <Centered>
        <div className="glass-card max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold">¡Sin tarjetas pendientes!</h2>
          <p className="mt-2 text-sm text-fgMuted">
            {nextDate
              ? `Próximo repaso: ${nextDate}`
              : 'Marca problemas como "Por repasar" o vuelve mañana.'}
          </p>
        </div>
      </Centered>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Repaso</h1>
          <p className="text-xs text-fgMuted">
            Tarjeta {index + 1} de {due.length}
          </p>
        </div>
      </header>

      <ReviewCard problem={current} revealed={revealed} onToggleReveal={() => setRevealed((r) => !r)} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <KeepRevisingToggle checked={keepRevising} onChange={setKeepRevising} />
        <p className="text-[11px] text-fgMuted">
          {keepRevising
            ? 'Valora tu recuerdo para programar el próximo repaso.'
            : 'Se eliminará de la cola y volverá al estado "Resuelto".'}
        </p>
      </div>

      {keepRevising ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {QUALITIES.map(({ q, label, tone }) => (
            <button
              key={q}
              disabled={isPending}
              onClick={() => handleRate(q)}
              className={
                'rounded-lg px-3 py-3 text-sm font-medium transition disabled:opacity-50 ' + tone
              }
            >
              <div className="text-xs text-fgMuted">{q}</div>
              <div>{label}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleFinish}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-status-solved/20 px-3 py-3 text-sm font-medium text-status-solved transition hover:bg-status-solved/30 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Listo — no necesito repasarlo más
          </button>
        </div>
      )}
    </div>
  );
}

function KeepRevisingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-fgSoft">
      <span
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition',
          checked
            ? 'border-brand-400 bg-brand-400/30 text-brand-200'
            : 'border-glass-stroke bg-transparent'
        )}
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <span onClick={() => onChange(!checked)}>Seguir repasando</span>
    </label>
  );
}

function ReviewCard({
  problem,
  revealed,
  onToggleReveal,
}: {
  problem: Problem;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <div className="glass-card flex-1 min-h-0 overflow-auto scroll-thin p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-fgMuted">#{problem.number ?? '—'}</div>
          <h2 className="text-lg font-semibold">{problem.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <DifficultyBadge value={problem.difficulty} />
          {problem.pattern ? (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-fgMuted">
              {problem.pattern}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={onToggleReveal}>
          {revealed ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
          {revealed ? 'Ocultar' : 'Mostrar'} solución y notas
        </Button>
      </div>

      {revealed ? (
        <div className="mt-4 space-y-4">
          {problem.solution ? (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fgMuted">Solución</h3>
              <pre className="overflow-x-auto rounded-md border border-glass-stroke bg-bg-300/80 p-3 text-xs text-fgSoft scroll-thin">
                <code>{problem.solution}</code>
              </pre>
            </section>
          ) : null}
          {problem.notes ? (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fgMuted">Notas</h3>
              <p className="whitespace-pre-wrap text-sm text-fgSoft">{problem.notes}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>;
}
