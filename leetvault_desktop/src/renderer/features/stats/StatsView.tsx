import { memo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInterviewStats, useStatsBundle } from './hooks';
import type { DateCount, DifficultyCount, PatternCount } from '@shared/types/stats';
import type {
  InterviewStatsBundle,
  InterviewVerdict,
} from '@shared/types/interview';
import { formatDateLong } from '../../i18n/format';

const DIFF_COLORS: Record<string, string> = {
  Easy: '#00A896',
  Medium: '#E6A817',
  Hard: '#D94F3D',
};

const HEATMAP_PALETTE = [
  '#EDE0D0',
  '#F5C48A',
  '#F0A030',
  '#D97B10',
  '#B85C00',
];

export function StatsView() {
  const { t } = useTranslation('stats');
  const { data, isLoading } = useStatsBundle();
  const { data: interview } = useInterviewStats();

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-fgMuted">{t('loading')}</div>;
  }

  const summary = data.next_review
    ? t('summaryNext', {
        count: data.total,
        due: data.due_reviews,
        date: data.next_review,
      })
    : t('summary', { count: data.total, due: data.due_reviews });

  return (
    <div className="h-full min-h-0 overflow-auto scroll-hide">
      <div className="flex flex-col gap-4 p-6">
        <header>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-xs text-fgMuted">{summary}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DifficultyChart data={data.by_difficulty} />
          <PatternChart data={data.by_pattern} />
        </div>

        <ActivityHeatmap data={data.by_date} />

        {interview && interview.total > 0 ? (
          <InterviewStatsSection data={interview} />
        ) : (
          <InterviewStatsEmpty />
        )}
      </div>
    </div>
  );
}

const DifficultyChart = memo(function DifficultyChart({
  data,
}: {
  data: DifficultyCount[];
}) {
  const { t } = useTranslation('stats');
  const rows = data.map((d) => ({
    difficulty: d.difficulty ?? t('unclassified'),
    cnt: d.cnt,
  }));
  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">{t('difficulty')}</h2>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey="cnt" nameKey="difficulty" innerRadius={40} outerRadius={70}>
              {rows.map((d) => (
                <Cell key={d.difficulty} fill={DIFF_COLORS[d.difficulty] ?? '#888'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1A120D',
                border: '1px solid rgba(255,232,194,0.10)',
                color: '#F7EEE4',
                fontSize: 12,
                borderRadius: 8,
                padding: '6px 10px',
              }}
              itemStyle={{ color: '#F7EEE4' }}
              labelStyle={{ color: '#F7EEE4' }}
              formatter={(value: number, name: string) => [
                t('totalProblems', { count: value }),
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex justify-center gap-4 text-xs text-fgMuted">
        {rows.map((d) => (
          <li key={d.difficulty} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: DIFF_COLORS[d.difficulty] ?? '#888' }}
            />
            {d.difficulty} · {d.cnt}
          </li>
        ))}
      </ul>
    </section>
  );
});

const PatternChart = memo(function PatternChart({
  data,
}: {
  data: PatternCount[];
}) {
  const { t } = useTranslation('stats');
  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">{t('topPatterns')}</h2>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
            <XAxis type="number" tick={{ fill: '#F7EEE4', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="pattern"
              tick={{ fill: '#F7EEE4', fontSize: 11 }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: '#1A120D',
                border: '1px solid rgba(255,232,194,0.10)',
                color: '#F7EEE4',
                fontSize: 12,
                borderRadius: 8,
                padding: '6px 10px',
              }}
              itemStyle={{ color: '#F7EEE4' }}
              labelStyle={{ color: '#F7EEE4' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(value: number) => [
                t('totalProblems', { count: value }),
                t('tooltipTotal'),
              ]}
            />
            <Bar dataKey="cnt" fill="#FFA116" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});

const ActivityHeatmap = memo(function ActivityHeatmap({
  data,
}: {
  data: DateCount[];
}) {
  const { t } = useTranslation('stats');
  const countsByDate = new Map(data.map((d) => [d.date_solved, d.cnt]));
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 6);

  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">{t('activityTitle')}</h2>
      <div className="leetvault-heatmap mx-auto max-w-[640px] px-4">
        <CalendarHeatmap
          startDate={start}
          endDate={today}
          values={data.map((d) => ({ date: d.date_solved, count: d.cnt }))}
          classForValue={(v) => {
            if (!v || !v.count) return 'lv-cell-empty';
            const idx = Math.min(v.count - 1, HEATMAP_PALETTE.length - 1);
            return `lv-cell-${idx}`;
          }}
          titleForValue={(v) => {
            if (!v || !v.date) return '';
            const cnt = countsByDate.get(v.date) ?? 0;
            const label = t('heatmap.problems', { count: cnt });
            return `${formatDateLong(new Date(v.date))} — ${label}`;
          }}
          showWeekdayLabels
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-2.5 px-4 text-xs text-fgMuted">
        <span>{t('legend.less')}</span>
        <span
          className="h-4 w-4 rounded-[4px] border border-glass-stroke"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          aria-label={t('legend.empty')}
        />
        {HEATMAP_PALETTE.map((c, i) => (
          <span
            key={c}
            className="h-4 w-4 rounded-[4px]"
            style={{ background: c }}
            aria-label={t('legend.level', { n: i + 1 })}
          />
        ))}
        <span>{t('legend.more')}</span>
      </div>
    </section>
  );
});

const VERDICT_COLORS: Record<InterviewVerdict, string> = {
  'Strong Hire': '#2E8B6A',
  Hire: '#00A896',
  'Lean Hire': '#E6A817',
  'No Hire': '#D94F3D',
};

type ScoreKey = keyof NonNullable<InterviewStatsBundle['avgScores']>;
const SCORE_LABEL_KEYS: Record<ScoreKey, string> = {
  communication: 'criteria.communication',
  problem_solving: 'criteria.problemSolving',
  code_quality: 'criteria.codeQuality',
  complexity_analysis: 'criteria.complexity',
};

function useFormatDuration() {
  const { t } = useTranslation('stats');
  return (sec: number): string => {
    if (sec <= 0) return t('duration.zero');
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h > 0) return t('duration.hoursMinutes', { h, m });
    return t('duration.minutes', { count: m });
  };
}

function useFormatRelativeDate() {
  const { t } = useTranslation('stats');
  return (iso: string): string => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const day = 86400000;
    if (diff < day) return t('relative.today');
    if (diff < day * 2) return t('relative.yesterday');
    const days = Math.floor(diff / day);
    if (days < 14) return t('relative.daysAgo', { count: days });
    return d.toISOString().slice(0, 10);
  };
}

function InterviewStatsEmpty(): JSX.Element {
  const { t } = useTranslation('stats');
  return (
    <section className="glass-card-dim p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-400" />
        <h2 className="text-sm font-semibold">{t('interview.title')}</h2>
      </div>
      <p className="text-xs text-fgMuted">{t('interview.empty')}</p>
    </section>
  );
}

const InterviewStatsSection = memo(function InterviewStatsSection({
  data,
}: {
  data: InterviewStatsBundle;
}): JSX.Element {
  const { t } = useTranslation('stats');
  const formatDuration = useFormatDuration();
  const formatRelativeDate = useFormatRelativeDate();
  return (
    <section className="glass-card-dim p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold">{t('interview.title')}</h2>
        </div>
        <p className="text-[11px] text-fgMuted">
          {t('interview.header', {
            count: data.total,
            time: formatDuration(data.totalSeconds),
          })}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label={t('interview.tile.sessions')} value={data.total.toString()} />
        <StatTile
          label={t('interview.tile.avgDuration')}
          value={formatDuration(data.avgDurationSec)}
        />
        <StatTile
          label={t('interview.tile.scored')}
          value={`${data.scoredCount}/${data.total}`}
        />
        <StatTile
          label={t('interview.tile.topVerdict')}
          value={topVerdict(data.byVerdict) ?? '—'}
          valueClassName="text-brand-300"
        />
      </div>

      {data.avgScores ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            {t('interview.criteriaTitle')}
          </h3>
          <ul className="space-y-1.5">
            {(Object.keys(SCORE_LABEL_KEYS) as ScoreKey[]).map((k) => {
              const v = data.avgScores![k];
              const pct = Math.max(0, Math.min(100, (v / 5) * 100));
              return (
                <li key={k} className="flex items-center gap-3">
                  <span className="w-44 text-xs text-fgSoft">{t(SCORE_LABEL_KEYS[k])}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-300/70">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums text-fg">
                    {v.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VerdictBreakdown data={data} />
        <SplitsBreakdown data={data} />
      </div>

      {data.recent.length > 0 ? (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            {t('interview.recent')}
          </h3>
          <ul className="divide-y divide-glass-stroke/40 overflow-hidden rounded-md border border-glass-stroke/40">
            {data.recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-fgSoft">{r.problemId}</div>
                  <div className="text-[10px] text-fgMuted">
                    {r.difficulty} · {r.language} · {formatDuration(r.durationSec)} ·{' '}
                    {formatRelativeDate(r.startedAt)}
                  </div>
                </div>
                {r.overall ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${VERDICT_COLORS[r.overall]}22`,
                      color: VERDICT_COLORS[r.overall],
                    }}
                  >
                    {r.overall}
                  </span>
                ) : (
                  <span className="text-[10px] text-fgMuted">{t('interview.noScore')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
});

function StatTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}): JSX.Element {
  return (
    <div className="rounded-md border border-glass-stroke/40 bg-bg-300/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-fgMuted">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold text-fg ${valueClassName ?? ''}`}>
        {value}
      </div>
    </div>
  );
}

function topVerdict(rows: InterviewStatsBundle['byVerdict']): InterviewVerdict | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, r) => (r.cnt > best.cnt ? r : best)).verdict;
}

function VerdictBreakdown({ data }: { data: InterviewStatsBundle }): JSX.Element {
  const { t } = useTranslation('stats');
  const order: InterviewVerdict[] = ['Strong Hire', 'Hire', 'Lean Hire', 'No Hire'];
  const map = new Map(data.byVerdict.map((v) => [v.verdict, v.cnt]));
  const total = data.byVerdict.reduce((sum, v) => sum + v.cnt, 0);
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
        {t('interview.verdicts')}
      </h3>
      {total === 0 ? (
        <p className="text-xs text-fgMuted">{t('interview.verdictsEmpty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {order.map((v) => {
            const cnt = map.get(v) ?? 0;
            const pct = total > 0 ? (cnt / total) * 100 : 0;
            return (
              <li key={v} className="flex items-center gap-3">
                <span className="w-24 text-xs text-fgSoft">{v}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-300/70">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: VERDICT_COLORS[v] }}
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-fg">{cnt}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SplitsBreakdown({ data }: { data: InterviewStatsBundle }): JSX.Element {
  const { t } = useTranslation('stats');
  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          {t('interview.byDifficulty')}
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {data.byDifficulty.length === 0 ? (
            <li className="text-xs text-fgMuted">—</li>
          ) : (
            data.byDifficulty.map((d) => (
              <li
                key={d.difficulty}
                className="rounded-full border border-glass-stroke/60 bg-bg-300/40 px-2.5 py-1 text-[11px] text-fgSoft"
              >
                <span style={{ color: DIFF_COLORS[d.difficulty] ?? '#888' }}>●</span>{' '}
                {d.difficulty} · {d.cnt}
              </li>
            ))
          )}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          {t('interview.byLanguage')}
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {data.byLanguage.length === 0 ? (
            <li className="text-xs text-fgMuted">—</li>
          ) : (
            data.byLanguage.map((l) => (
              <li
                key={l.language}
                className="rounded-full border border-glass-stroke/60 bg-bg-300/40 px-2.5 py-1 text-[11px] text-fgSoft"
              >
                {l.language} · {l.cnt}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
