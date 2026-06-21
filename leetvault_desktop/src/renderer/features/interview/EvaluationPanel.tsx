import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import type {
  InterviewEvaluation,
  InterviewProblem,
} from '@shared/types/interview';
import { useInterview } from './store';

const VERDICT_STYLE: Record<InterviewEvaluation['overall'], string> = {
  'Strong Hire': 'bg-status-solved/20 text-status-solved border-status-solved/40',
  Hire: 'bg-brand-500/20 text-brand-400 border-brand-500/40',
  'Lean Hire': 'bg-status-inprogress/20 text-status-inprogress border-status-inprogress/40',
  'No Hire': 'bg-diff-hard/20 text-diff-hard border-diff-hard/40',
};

const SCORE_LABELS: Array<{
  key: keyof InterviewEvaluation['scores'];
  label: string;
}> = [
  { key: 'communication', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem solving' },
  { key: 'code_quality', label: 'Code quality' },
  { key: 'complexity_analysis', label: 'Complexity analysis' },
];

export function EvaluationPanel(): JSX.Element {
  const evaluation = useInterview((s) => s.evaluation);
  const evaluationRaw = useInterview((s) => s.evaluationRaw);
  const problemFull = useInterview((s) => s.problemFull);
  const resetToSetup = useInterview((s) => s.resetToSetup);

  if (!problemFull) {
    return (
      <div className="p-6 text-sm text-fgMuted">No session loaded.</div>
    );
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 p-6">
        <Header
          title={problemFull.title}
          difficulty={problemFull.difficulty}
          topics={problemFull.topics}
        />

        {evaluation ? (
          <ScoreCard evaluation={evaluation} expected={problemFull.expected_complexity} />
        ) : (
          <RawFallback raw={evaluationRaw ?? '(no response)'} />
        )}

        <ReferenceSolution problem={problemFull} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetToSetup}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to setup
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({
  title,
  difficulty,
  topics,
}: {
  title: string;
  difficulty: InterviewProblem['difficulty'];
  topics: string[];
}): JSX.Element {
  return (
    <div className="glass-card-dim p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-fgMuted">
        <span className="rounded-full border border-glass-stroke bg-bg-200/40 px-2 py-0.5">
          {difficulty}
        </span>
        {topics.map((t) => (
          <span key={t} className="rounded-full bg-bg-200/40 px-2 py-0.5">
            {t}
          </span>
        ))}
      </div>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
    </div>
  );
}

function ScoreCard({
  evaluation,
  expected,
}: {
  evaluation: InterviewEvaluation;
  expected: { time: string; space: string };
}): JSX.Element {
  return (
    <div className="glass-card-dim space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-fgMuted">
          Evaluation
        </h3>
        <span
          className={
            'rounded-full border px-3 py-1 text-xs font-semibold ' +
            VERDICT_STYLE[evaluation.overall]
          }
        >
          {evaluation.overall}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCORE_LABELS.map((s) => (
          <ScoreBar
            key={s.key}
            label={s.label}
            value={evaluation.scores[s.key] as number}
          />
        ))}
      </div>

      <ComplexityTable
        user={evaluation.complexity_user}
        expected={expected}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Column title="Strengths" items={evaluation.strengths} tone="good" />
        <Column
          title="Improvements"
          items={evaluation.improvements}
          tone="bad"
        />
      </div>

      {evaluation.edge_cases_missed.length > 0 ? (
        <Column
          title="Edge cases missed"
          items={evaluation.edge_cases_missed}
          tone="bad"
        />
      ) : null}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Summary
        </h4>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fgSoft">
          {evaluation.summary}
        </p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }): JSX.Element {
  const pct = (value / 5) * 100;
  const tone =
    value >= 4
      ? 'bg-status-solved'
      : value === 3
      ? 'bg-brand-500'
      : value === 2
      ? 'bg-status-inprogress'
      : 'bg-diff-hard';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-fgSoft">{label}</span>
        <span className="tabular-nums text-fgMuted">{value}/5</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-200/60">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ComplexityTable({
  user,
  expected,
}: {
  user: { time: string; space: string; correct: boolean };
  expected: { time: string; space: string };
}): JSX.Element {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
        Complexity comparison
      </h4>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div />
        <div className="text-fgMuted">Your analysis</div>
        <div className="text-fgMuted">Expected</div>

        <div className="text-fgMuted">Time</div>
        <div className="font-mono text-fgSoft">{user.time || '—'}</div>
        <div className="font-mono text-fgSoft">{expected.time}</div>

        <div className="text-fgMuted">Space</div>
        <div className="font-mono text-fgSoft">{user.space || '—'}</div>
        <div className="font-mono text-fgSoft">{expected.space}</div>
      </div>
      <div className="mt-2 text-xs">
        {user.correct ? (
          <span className="text-status-solved">Complexity matches expected.</span>
        ) : (
          <span className="text-diff-hard">Complexity differs from expected.</span>
        )}
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'good' | 'bad';
}): JSX.Element {
  const bullet = tone === 'good' ? 'text-status-solved' : 'text-diff-hard';
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="mt-1.5 text-xs text-fgMuted">(none)</p>
      ) : (
        <ul className="mt-1.5 space-y-1 text-sm text-fgSoft">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className={bullet}>•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReferenceSolution({ problem }: { problem: InterviewProblem }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card-dim overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-sm font-semibold">Reference solution</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-fgMuted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-fgMuted" />
        )}
      </button>
      {open ? (
        <div className="space-y-3 border-t border-glass-stroke/60 px-5 py-4 text-sm">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
              Expected complexity
            </h4>
            <p className="mt-1 font-mono text-xs text-fgSoft">
              time {problem.expected_complexity.time} · space{' '}
              {problem.expected_complexity.space}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
              Approach
            </h4>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-fgSoft">
              {problem.expected_solution}
            </pre>
          </div>
          {problem.examples.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
                Examples
              </h4>
              <ul className="mt-1 space-y-2 text-xs">
                {problem.examples.map((ex, i) => (
                  <li key={i} className="rounded-md bg-bg-200/40 p-2 font-mono">
                    <div>input: {ex.input}</div>
                    <div>output: {ex.output}</div>
                    {ex.note ? <div className="text-fgMuted">note: {ex.note}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RawFallback({ raw }: { raw: string }): JSX.Element {
  return (
    <div className="glass-card-dim p-5">
      <h3 className="text-sm font-semibold text-diff-hard">
        Could not parse evaluation JSON
      </h3>
      <p className="mt-1 text-xs text-fgMuted">
        The model response is shown below. Please try finishing again — this usually
        recovers on the next attempt.
      </p>
      <pre className="scroll-thin mt-3 max-h-[40vh] overflow-auto rounded-md bg-bg-200/60 p-3 text-[11px] text-fgSoft">
        {raw}
      </pre>
    </div>
  );
}
