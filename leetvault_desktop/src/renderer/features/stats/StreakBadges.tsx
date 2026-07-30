import { memo } from 'react';
import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsBundle } from '@shared/types/stats';
import { cn } from '../../lib/cn';
import first1 from '../../assets/badges/first1.png';
import streak5 from '../../assets/badges/streak5.png';
import streak30 from '../../assets/badges/streak30.png';
import streak100 from '../../assets/badges/streak100.png';
import solved25 from '../../assets/badges/solved25.png';
import solved100 from '../../assets/badges/solved100.png';
import solved250 from '../../assets/badges/solved250.png';
import hard10 from '../../assets/badges/hard10.png';
import balanced10 from '../../assets/badges/balanced10.png';
import patterns8 from '../../assets/badges/patterns8.png';
import grind5 from '../../assets/badges/grind5.png';
import grind10 from '../../assets/badges/grind10.png';

interface BadgeStats {
  best: number;
  total: number;
  easy: number;
  medium: number;
  hard: number;
  patterns: number;
  maxDay: number;
}

const BADGES: { id: string; img: string; threshold: number; value: (s: BadgeStats) => number }[] = [
  { id: 'first1', img: first1, threshold: 1, value: (s) => s.total },
  { id: 'streak5', img: streak5, threshold: 5, value: (s) => s.best },
  { id: 'streak30', img: streak30, threshold: 30, value: (s) => s.best },
  { id: 'streak100', img: streak100, threshold: 100, value: (s) => s.best },
  { id: 'solved25', img: solved25, threshold: 25, value: (s) => s.total },
  { id: 'solved100', img: solved100, threshold: 100, value: (s) => s.total },
  { id: 'solved250', img: solved250, threshold: 250, value: (s) => s.total },
  { id: 'hard10', img: hard10, threshold: 10, value: (s) => s.hard },
  { id: 'balanced10', img: balanced10, threshold: 10, value: (s) => Math.min(s.easy, s.medium, s.hard) },
  { id: 'patterns8', img: patterns8, threshold: 8, value: (s) => s.patterns },
  { id: 'grind5', img: grind5, threshold: 5, value: (s) => s.maxDay },
  { id: 'grind10', img: grind10, threshold: 10, value: (s) => s.maxDay },
];

function dayNum(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
}

export function localTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeStreaks(dates: string[]): { current: number; best: number } {
  const days = [...new Set(dates)].map(dayNum).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = NaN;
  for (const d of days) {
    run = d === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  const set = new Set(days);
  const today = dayNum(localTodayIso());
  // A streak survives until the end of today, so yesterday still counts.
  let cursor = set.has(today) ? today : set.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, best };
}

function diffCount(bundle: StatsBundle, diff: 'Easy' | 'Medium' | 'Hard'): number {
  return bundle.by_difficulty.find((d) => d.difficulty === diff)?.cnt ?? 0;
}

export const BadgesSection = memo(function BadgesSection({
  bundle,
}: {
  bundle: StatsBundle;
}): JSX.Element {
  const { t } = useTranslation('stats');
  const stats: BadgeStats = {
    best: computeStreaks(bundle.by_date.map((d) => d.date_solved)).best,
    total: bundle.total,
    easy: diffCount(bundle, 'Easy'),
    medium: diffCount(bundle, 'Medium'),
    hard: diffCount(bundle, 'Hard'),
    patterns: bundle.by_pattern.length,
    maxDay: bundle.by_date.reduce((max, d) => Math.max(max, d.cnt), 0),
  };
  const unlockedCount = BADGES.filter(({ threshold, value }) => value(stats) >= threshold).length;

  return (
    <section className="glass-card-dim p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold">{t('badgesTitle')}</h2>
        </div>
        <span className="text-[11px] tabular-nums text-fg/[0.68]">
          {unlockedCount}/{BADGES.length}
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-y-6 min-[1100px]:grid-cols-6">
        {BADGES.map(({ id, img, threshold, value }) => (
          <SocketBadge
            key={id}
            id={id}
            img={img}
            threshold={threshold}
            current={Math.min(value(stats), threshold)}
          />
        ))}
      </ul>
    </section>
  );
});

function SocketBadge({
  id,
  img,
  threshold,
  current,
}: {
  id: string;
  img: string;
  threshold: number;
  current: number;
}): JSX.Element {
  const { t } = useTranslation('stats');
  const unlocked = current >= threshold;

  return (
    <li className="group relative flex justify-center">
      {/* recessed socket */}
      <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-fg/[0.03] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] ring-1 ring-glass-stroke/10">
        <img
          src={img}
          alt=""
          draggable={false}
          className={cn(
            'h-16 w-16 select-none object-contain transition-transform duration-150 group-hover:scale-110',
            unlocked
              ? 'drop-shadow-[0_0_10px_rgba(255,161,22,0.30)]'
              : 'opacity-40 grayscale'
          )}
        />
      </div>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-44 -translate-x-1/2 rounded-lg border border-glass-stroke/10 bg-bg-200/95 p-2.5 text-center opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100">
        <div className="text-xs font-semibold text-fg">{t(`badges.${id}.name`)}</div>
        <p className="mt-0.5 text-[10px] leading-snug text-fg/[0.68]">
          {t(`badges.${id}.desc`)}
        </p>
        {!unlocked ? (
          <div className="mt-1 text-[10px] font-medium tabular-nums text-fg/[0.68]">
            {t('badges.progress', { current, total: threshold })}
          </div>
        ) : null}
      </div>
    </li>
  );
}
