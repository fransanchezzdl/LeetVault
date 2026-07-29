import { useEffect, useRef, useState } from 'react';
import {
  CalendarCheck,
  Check,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  StickyNote,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Problem } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';
import { DifficultyBadge } from '../../components/badges/Badges';
import { cn } from '../../lib/cn';
import { leetcodeProblemUrl } from '../../lib/leetcodeUrl';
import { formatDateShort } from '../../i18n/format';
import { detectLanguage, HighlightedCode, LANGUAGE_LABELS } from './HighlightedCode';
import {
  useDueReviews,
  useFinishReview,
  useNextReviewDate,
  useRateReview,
} from './hooks';

const QUALITIES: { q: Quality; labelKey: string; tone: string }[] = [
  { q: 0, labelKey: 'quality.blackout', tone: 'bg-diff-hard/20 text-diff-hard hover:bg-diff-hard/30' },
  { q: 2, labelKey: 'quality.hard', tone: 'bg-status-inprogress/20 text-status-inprogress hover:bg-status-inprogress/30' },
  { q: 3, labelKey: 'quality.good', tone: 'bg-diff-medium/20 text-diff-medium hover:bg-diff-medium/30' },
  { q: 4, labelKey: 'quality.easy', tone: 'bg-diff-easy/20 text-diff-easy hover:bg-diff-easy/30' },
  { q: 5, labelKey: 'quality.perfect', tone: 'bg-status-solved/20 text-status-solved hover:bg-status-solved/30' },
];

export function ReviewView() {
  const { t } = useTranslation('review');
  const { data: due = [], isLoading } = useDueReviews();
  const { data: nextDate } = useNextReviewDate();
  const { mutate: rate, isPending: rating } = useRateReview();
  const { mutate: finish, isPending: finishing } = useFinishReview();
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [keepRevising, setKeepRevising] = useState(true);
  const ratedCount = useRef(0);
  const sessionReported = useRef(false);

  useEffect(() => {
    if (index >= due.length) setIndex(0);
  }, [due.length, index]);

  useEffect(() => {
    if (isLoading) return;
    if (due.length === 0 && ratedCount.current > 0 && !sessionReported.current) {
      sessionReported.current = true;
      void window.lv.analytics.reviewSessionFinished(ratedCount.current);
      ratedCount.current = 0;
    }
    if (due.length > 0) {
      sessionReported.current = false;
    }
  }, [due.length, isLoading]);

  const current = due[index];
  const isPending = rating || finishing;

  const advance = () => {
    setShowNotes(false);
    setShowSolution(false);
    setKeepRevising(true);
    setIndex((i) => i + 1);
  };

  const handleRate = (q: Quality) => {
    if (!current) return;
    rate({ id: current.id, quality: q }, { onSuccess: () => { ratedCount.current += 1; advance(); } });
  };

  const handleFinish = () => {
    if (!current) return;
    finish(current.id, { onSuccess: () => { ratedCount.current += 1; advance(); } });
  };

  if (isLoading) {
    return <Centered>{t('loading')}</Centered>;
  }

  if (due.length === 0 || index >= due.length) {
    return (
      <Centered>
        <div className="glass-card max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
          <p className="mt-2 text-sm text-fg/[0.68]">
            {nextDate
              ? t('empty.nextDate', { date: nextDate })
              : t('empty.noUpcoming')}
          </p>
        </div>
      </Centered>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-xs text-fg/[0.68]">
            {t('cardProgress', { current: index + 1, total: due.length })}
          </p>
        </div>
      </header>

      <ReviewCard
        problem={current}
        showNotes={showNotes}
        showSolution={showSolution}
        onToggleNotes={() => setShowNotes((v) => !v)}
        onToggleSolution={() => setShowSolution((v) => !v)}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <KeepRevisingToggle checked={keepRevising} onChange={setKeepRevising} />
        <p className="text-[11px] text-fg/[0.68]">
          {keepRevising ? t('hint.keepRevising') : t('hint.finish')}
        </p>
      </div>

      {keepRevising ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {QUALITIES.map(({ q, labelKey, tone }) => (
            <button
              key={q}
              disabled={isPending}
              onClick={() => handleRate(q)}
              className={
                'rounded-lg px-3 py-3 text-sm font-medium transition disabled:opacity-50 ' + tone
              }
            >
              <div className="text-xs text-fg/[0.68]">{q}</div>
              <div>{t(labelKey)}</div>
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
            {t('finishButton')}
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
  const { t } = useTranslation('review');
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-fgSoft">
      <span
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition',
          checked
            ? 'border-brand-400 bg-brand-400/30 text-brand-200'
            : 'border-glass-stroke/10 bg-transparent'
        )}
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <span onClick={() => onChange(!checked)}>{t('keepRevising')}</span>
    </label>
  );
}

function ReviewCard({
  problem,
  showNotes,
  showSolution,
  onToggleNotes,
  onToggleSolution,
}: {
  problem: Problem;
  showNotes: boolean;
  showSolution: boolean;
  onToggleNotes: () => void;
  onToggleSolution: () => void;
}) {
  const { t } = useTranslation('review');
  const langLabel = problem.solution
    ? LANGUAGE_LABELS[detectLanguage(problem.solution)]
    : undefined;

  return (
    <div className="glass-card flex-1 min-h-0 overflow-auto scroll-thin p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-fg/[0.68]">#{problem.number ?? '—'}</div>
          <h2 className="text-lg font-semibold">{problem.title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg/[0.68]">
            {problem.date_solved ? (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                {t('meta.solvedOn', { date: formatDateShort(new Date(problem.date_solved)) })}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {t('meta.reviews', { count: problem.sr_repetitions })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DifficultyBadge value={problem.difficulty} />
          {problem.pattern ? (
            <span className="rounded-full bg-fg/5 px-2 py-0.5 text-xs text-fg/[0.68]">
              {problem.pattern}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => window.lv.app.openExternal(leetcodeProblemUrl(problem.title))}
            title={t('openProblem')}
            className="rounded p-1 text-fgSoft/70 hover:bg-fg/10 hover:text-fg"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <RevealSection
          icon={<StickyNote className="h-4 w-4 text-brand-400" />}
          title={t('section.notes')}
          open={showNotes}
          onToggle={onToggleNotes}
        >
          {problem.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fgSoft">
              {problem.notes}
            </p>
          ) : (
            <p className="text-sm italic text-fg/[0.45]">{t('notes.empty')}</p>
          )}
        </RevealSection>

        <RevealSection
          icon={<Code2 className="h-4 w-4 text-brand-400" />}
          title={t('section.solution')}
          badge={langLabel}
          open={showSolution}
          onToggle={onToggleSolution}
        >
          {problem.solution ? (
            <HighlightedCode code={problem.solution} />
          ) : (
            <p className="text-sm italic text-fg/[0.45]">{t('solution.empty')}</p>
          )}
        </RevealSection>
      </div>
    </div>
  );
}

function RevealSection({
  icon,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('review');
  return (
    <section className="rounded-lg border border-glass-stroke/10 bg-bg-300/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition hover:bg-fg/5"
      >
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-fg/[0.68]">
          {title}
        </span>
        {badge ? (
          <span className="rounded-full bg-fg/5 px-2 py-0.5 text-[10px] text-fg/[0.68]">
            {badge}
          </span>
        ) : null}
        <span
          className="ml-auto text-fg/[0.68]"
          title={open ? t('reveal.hide') : t('reveal.show')}
        >
          {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open ? (
        <div className="border-t border-glass-stroke/10 px-4 py-3">{children}</div>
      ) : null}
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>;
}
