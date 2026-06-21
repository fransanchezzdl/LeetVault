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
// import { useElasticScroll } from '../../lib/useElasticScroll'; // Unused for now
import { useInterviewStats, useStatsBundle } from './hooks';
import type { DateCount, DifficultyCount, PatternCount } from '@shared/types/stats';
import type {
  InterviewStatsBundle,
  InterviewVerdict,
} from '@shared/types/interview';

const DIFF_COLORS: Record<string, string> = {
  Easy: '#00A896',
  Medium: '#E6A817',
  Hard: '#D94F3D',
};

const HEATMAP_PALETTE = [
  '#EDE0D0', // 1
  '#F5C48A', // 2
  '#F0A030', // 3
  '#D97B10', // 4
  '#B85C00', // 5+
];

export function StatsView() {
  const { data, isLoading } = useStatsBundle();
  const { data: interview } = useInterviewStats();
  // const { ref, onWheel, style } = useElasticScroll<HTMLDivElement>(); // Unused for now

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-fgMuted">Cargando estadísticas…</div>;
  }

  return (
    <div /* ref={ref} onWheel={onWheel} */ className="h-full min-h-0 overflow-auto scroll-hide">
      <div /* style={style} */ className="flex flex-col gap-4 p-6">
        <header>
          <h1 className="text-xl font-semibold">Estadísticas</h1>
          <p className="text-xs text-fgMuted">
            {data.total} problemas guardados · {data.due_reviews} pendientes
            {data.next_review ? ` · próximo: ${data.next_review}` : ''}
          </p>
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
  const rows = data.map((d) => ({ difficulty: d.difficulty ?? 'Sin clasificar', cnt: d.cnt }));
  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">Dificultad</h2>
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
              formatter={(value: number, name: string) => [`${value} problemas`, name]}
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
  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">Patrones más resueltos</h2>
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
              formatter={(value: number) => [`${value} problemas`, 'Total']}
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
  const countsByDate = new Map(data.map((d) => [d.date_solved, d.cnt]));
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 6);

  const MONTHS_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  return (
    <section className="glass-card-dim p-4">
      <h2 className="mb-3 text-sm font-semibold">Actividad — últimos 6 meses</h2>
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
            const d = new Date(v.date);
            const day = d.getDate();
            const month = MONTHS_ES[d.getMonth()];
            const label = cnt === 1 ? '1 problema' : `${cnt} problemas`;
            return `${day} ${month} — ${label}`;
          }}
          showWeekdayLabels
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-2.5 px-4 text-xs text-fgMuted">
        <span>Menos</span>
        <span
          className="h-4 w-4 rounded-[4px] border border-glass-stroke"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          aria-label="Sin actividad"
        />
        {HEATMAP_PALETTE.map((c, i) => (
          <span
            key={c}
            className="h-4 w-4 rounded-[4px]"
            style={{ background: c }}
            aria-label={`Nivel ${i + 1}`}
          />
        ))}
        <span>Más</span>
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

const SCORE_LABELS: Record<keyof NonNullable<InterviewStatsBundle['avgScores']>, string> = {
  communication: 'Comunicación',
  problem_solving: 'Resolución',
  code_quality: 'Calidad de código',
  complexity_analysis: 'Análisis de complejidad',
};

function formatDuration(sec: number): string {
  if (sec <= 0) return '0 min';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day) return 'hoy';
  if (diff < day * 2) return 'ayer';
  const days = Math.floor(diff / day);
  if (days < 14) return `hace ${days} días`;
  return d.toISOString().slice(0, 10);
}

function InterviewStatsEmpty(): JSX.Element {
  return (
    <section className="glass-card-dim p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-400" />
        <h2 className="text-sm font-semibold">Entrevistas simuladas</h2>
      </div>
      <p className="text-xs text-fgMuted">
        Aún no has terminado ninguna entrevista. Cuando completes alguna, aquí verás tu
        desempeño promedio, el reparto de veredictos y tu actividad reciente.
      </p>
    </section>
  );
}

const InterviewStatsSection = memo(function InterviewStatsSection({
  data,
}: {
  data: InterviewStatsBundle;
}): JSX.Element {
  return (
    <section className="glass-card-dim p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold">Entrevistas simuladas</h2>
        </div>
        <p className="text-[11px] text-fgMuted">
          {data.total} sesión{data.total === 1 ? '' : 'es'} · tiempo total{' '}
          {formatDuration(data.totalSeconds)}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Sesiones" value={data.total.toString()} />
        <StatTile label="Duración media" value={formatDuration(data.avgDurationSec)} />
        <StatTile
          label="Evaluadas"
          value={`${data.scoredCount}/${data.total}`}
        />
        <StatTile
          label="Veredicto top"
          value={topVerdict(data.byVerdict) ?? '—'}
          valueClassName="text-brand-300"
        />
      </div>

      {data.avgScores ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
            Promedio por criterio (1-5)
          </h3>
          <ul className="space-y-1.5">
            {(Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>).map((k) => {
              const v = data.avgScores![k];
              const pct = Math.max(0, Math.min(100, (v / 5) * 100));
              return (
                <li key={k} className="flex items-center gap-3">
                  <span className="w-44 text-xs text-fgSoft">{SCORE_LABELS[k]}</span>
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
            Recientes
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
                  <span className="text-[10px] text-fgMuted">sin nota</span>
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
  const order: InterviewVerdict[] = ['Strong Hire', 'Hire', 'Lean Hire', 'No Hire'];
  const map = new Map(data.byVerdict.map((v) => [v.verdict, v.cnt]));
  const total = data.byVerdict.reduce((sum, v) => sum + v.cnt, 0);
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
        Veredictos
      </h3>
      {total === 0 ? (
        <p className="text-xs text-fgMuted">Sin evaluaciones todavía.</p>
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
  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          Por dificultad
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
          Por lenguaje
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
