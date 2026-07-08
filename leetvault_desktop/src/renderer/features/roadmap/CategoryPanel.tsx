import { Check, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RoadmapCategory } from './data/types';
import { cn } from '../../lib/cn';

interface Props {
  category: RoadmapCategory | null;
  solved: Set<number>;
  onClose: () => void;
}

const DIFF_TONE: Record<string, string> = {
  Easy: 'text-diff-easy',
  Medium: 'text-diff-medium',
  Hard: 'text-diff-hard',
};

export function CategoryPanel({ category, solved, onClose }: Props) {
  const { t } = useTranslation(['roadmap', 'common']);
  if (!category) return null;
  const done = category.problems.filter((p) => solved.has(p.n)).length;

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col rounded-2xl border border-glass-stroke bg-bg-200/80 backdrop-blur-md">
      <header className="flex items-start justify-between border-b border-glass-stroke px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">{category.name}</h2>
          <p className="text-xs text-fgMuted">
            {t('roadmap:panel.solved', { done, total: category.problems.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-fgMuted hover:bg-white/10 hover:text-fg"
          title={t('common:actions.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="flex-1 overflow-auto scroll-thin p-2">
        {category.problems.map((p) => {
          const isSolved = solved.has(p.n);
          return (
            <li key={p.n}>
              <a
                href={`https://leetcode.com/problems/${p.slug}/`}
                onClick={(e) => {
                  e.preventDefault();
                  window.lv.app.openExternal(`https://leetcode.com/problems/${p.slug}/`);
                }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/5',
                  isSolved ? 'text-fg' : 'text-fgSoft'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px]',
                    isSolved
                      ? 'border-status-solved bg-status-solved/20 text-status-solved'
                      : 'border-glass-stroke text-transparent'
                  )}
                >
                  {isSolved ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="w-8 flex-shrink-0 text-xs text-fgMuted">{p.n}</span>
                <span className="flex-1 truncate">
                  {p.title}
                  {p.premium ? <span className="ml-1 text-[10px] text-brand-400">★</span> : null}
                </span>
                <span className={cn('text-[10px] font-medium', DIFF_TONE[p.diff])}>
                  {p.diff[0]}
                </span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-fgMuted opacity-0 group-hover:opacity-100" />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
