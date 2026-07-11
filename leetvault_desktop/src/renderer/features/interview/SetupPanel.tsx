import { useState } from 'react';
import { Play, ArrowRight, Sparkles, Target, Code2, Timer } from 'lucide-react';
import {
  siAirbnb,
  siApple,
  siDatadog,
  siDiscord,
  siGoogle,
  siMeta,
  siNetflix,
  siNvidia,
  siSpotify,
  siStripe,
  siUber,
} from 'simple-icons';
import type {
  InterviewDifficulty,
  InterviewLanguage,
} from '@shared/types/interview';
import { useInterview } from './store';

const DIFFICULTIES: { value: InterviewDifficulty | 'unknown'; label: string }[] = [
  { value: 'unknown', label: 'Surprise me' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const LANGUAGES: { value: InterviewLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
];

const TIMERS: { value: number | null; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: null, label: 'No timer' },
];

// Real brand logos from simple-icons (CC0). A handful of well-known tech
// employers — only ones that simple-icons currently ships; Amazon, Microsoft,
// Cabify, and Bending Spoons have been removed from the upstream library over
// trademark complaints, so they're not included here.
const BRANDS = [
  siApple,
  siGoogle,
  siMeta,
  siNetflix,
  siUber,
  siSpotify,
  siAirbnb,
  siDatadog,
  siNvidia,
  siStripe,
  siDiscord,
];

export function SetupPanel(): JSX.Element {
  const difficulty = useInterview((s) => s.difficulty);
  const language = useInterview((s) => s.language);
  const timerMin = useInterview((s) => s.timerMin);
  const setDifficulty = useInterview((s) => s.setDifficulty);
  const setLanguage = useInterview((s) => s.setLanguage);
  const setTimerMin = useInterview((s) => s.setTimerMin);
  const beginLive = useInterview((s) => s.beginLive);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (): Promise<void> => {
    setError(null);
    setStarting(true);
    try {
      const res = await window.lv.interview.start({
        difficulty,
        language,
        timerMin,
      });
      if (!res) {
        setError('Could not pick a problem. Please try a different difficulty.');
        return;
      }
      beginLive({
        sessionId: res.sessionId,
        problemPublic: res.problemPublic,
        startedAt: Date.now(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="relative h-full overflow-hidden">
      <FloatingCompanies />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <HeroHeader />

        <div className="glass-card-dim p-6">
          <SectionRow
            icon={<Target className="h-3.5 w-3.5" />}
            title="Difficulty"
            subtitle="Pick how spicy the problem should be."
          >
            <ChipRow>
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d.value}
                  active={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                >
                  {d.label}
                </Chip>
              ))}
            </ChipRow>
          </SectionRow>

          <Divider />

          <SectionRow
            icon={<Code2 className="h-3.5 w-3.5" />}
            title="Language"
            subtitle="What you'll code in. You can change it mid-session."
          >
            <ChipRow>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.value}
                  active={language === l.value}
                  onClick={() => setLanguage(l.value)}
                >
                  {l.label}
                </Chip>
              ))}
            </ChipRow>
          </SectionRow>

          <Divider />

          <SectionRow
            icon={<Timer className="h-3.5 w-3.5" />}
            title="Timer"
            subtitle="The clock starts once the editor is fully loaded."
          >
            <ChipRow>
              {TIMERS.map((t) => (
                <Chip
                  key={String(t.value)}
                  active={timerMin === t.value}
                  onClick={() => setTimerMin(t.value)}
                >
                  {t.label}
                </Chip>
              ))}
            </ChipRow>
          </SectionRow>
        </div>

        {error ? (
          <div className="rounded-lg border border-diff-hard/40 bg-diff-hard/10 px-3 py-2 text-xs text-diff-hard">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="btn-primary group inline-flex items-center gap-2 px-5 py-2.5 text-sm shadow-lg shadow-brand-500/10 transition disabled:opacity-50"
          >
            {starting ? (
              <>Starting…</>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start interview
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroHeader(): JSX.Element {
  return (
    <div className="glass-card-dim relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-brand-300/10 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-200">
          <Sparkles className="h-3 w-3" />
          Mock interview
        </div>
        <h2 className="mt-2.5 text-2xl font-semibold text-fg">
          Train the way <span className="text-brand-300">FAANG</span> hires.
        </h2>
        <p className="mt-1.5 max-w-xl text-xs text-fg/[0.68]">
          A live AI interviewer reads the problem, takes clarifying questions, and
          scores your communication, problem-solving, code quality, and complexity
          analysis when you finish.
        </p>
      </div>
    </div>
  );
}

function FloatingCompanies(): JSX.Element {
  // Logos sit in the left/right gutters only — the centered content card
  // (max-w-3xl, ~768px) covers the middle, so anything there would hide under
  // the glass panels. Sizes lean small so dark brand colors don't dominate.
  const layout: { top: string; left: string; size: number; delay: string; duration: string }[] = [
    // Left gutter
    { top: '6%',  left: '3%',  size: 56, delay: '0s',   duration: '11s' },
    { top: '24%', left: '7%',  size: 48, delay: '1.6s', duration: '13s' },
    { top: '44%', left: '2%',  size: 60, delay: '3s',   duration: '12s' },
    { top: '64%', left: '6%',  size: 52, delay: '0.8s', duration: '14s' },
    { top: '84%', left: '3%',  size: 56, delay: '2.4s', duration: '10s' },
    // Right gutter
    { top: '10%', left: '90%', size: 52, delay: '0.4s', duration: '12s' },
    { top: '30%', left: '94%', size: 60, delay: '2.0s', duration: '14s' },
    { top: '50%', left: '90%', size: 48, delay: '1.2s', duration: '11s' },
    { top: '70%', left: '94%', size: 56, delay: '3.4s', duration: '13s' },
    { top: '88%', left: '90%', size: 52, delay: '0.6s', duration: '15s' },
    { top: '18%', left: '95%', size: 44, delay: '2.8s', duration: '12s' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BRANDS.map((brand, i) => {
        const pos = layout[i % layout.length];
        return (
          <div
            key={brand.slug}
            className="absolute opacity-[0.14] [animation:lv-float_var(--d)_ease-in-out_infinite] motion-reduce:animate-none"
            style={{
              top: pos.top,
              left: pos.left,
              ['--d' as string]: pos.duration,
              animationDelay: pos.delay,
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.55))',
            }}
            aria-hidden="true"
          >
            <BrandLogo path={brand.path} color={`#${brand.hex}`} size={pos.size} />
          </div>
        );
      })}
      <style>{`
        @keyframes lv-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-18px) rotate(4deg); }
        }
      `}</style>
    </div>
  );
}

function BrandLogo({
  path,
  color,
  size,
}: {
  path: string;
  color: string;
  size: number;
}): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill={color} />
    </svg>
  );
}

function SectionRow(props: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr] md:items-start md:gap-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg">
          <span className="text-brand-300">{props.icon}</span>
          {props.title}
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-fg/[0.68]">
          {props.subtitle}
        </div>
      </div>
      <div>{props.children}</div>
    </div>
  );
}

function Divider(): JSX.Element {
  return <div className="my-5 h-px bg-glass-stroke/60" />;
}

function ChipRow(props: { children: React.ReactNode }): JSX.Element {
  return <div className="flex flex-wrap gap-2">{props.children}</div>;
}

function Chip(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        'rounded-full border px-3 py-1.5 text-xs font-medium transition ' +
        (props.active
          ? 'border-brand-500/60 bg-brand-500/15 text-fg shadow-sm shadow-brand-500/10'
          : 'border-glass-stroke/10 bg-fg/[0.05] text-fg/[0.68] hover:border-brand-500/30 hover:bg-fg/[0.08] hover:text-fg')
      }
    >
      {props.children}
    </button>
  );
}
