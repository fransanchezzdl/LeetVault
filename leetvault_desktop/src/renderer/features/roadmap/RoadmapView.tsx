import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectOption } from '../../components/ui/Select';
import { useProblems } from '../problems/hooks';
import { NEETCODE_150 } from './data/neetcode150';
import { NEETCODE_250 } from './data/neetcode250';
import { BLIND_75 } from './data/blind75';
import { LC_75 } from './data/lc75';
import type { RoadmapList } from './data/types';
import { RoadmapTree } from './RoadmapTree';
import { CategoryPanel } from './CategoryPanel';

const LISTS: RoadmapList[] = [NEETCODE_150, NEETCODE_250, BLIND_75, LC_75];

export function RoadmapView() {
  const { t } = useTranslation('roadmap');
  const { data: problems = [] } = useProblems();
  const [listId, setListId] = useState<string>(NEETCODE_150.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = LISTS.find((l) => l.id === listId) ?? NEETCODE_150;

  const solved = useMemo(() => {
    const s = new Set<number>();
    for (const p of problems) {
      if (p.status === 'Solved' && p.number != null) s.add(p.number);
    }
    return s;
  }, [problems]);

  const selectedCategory = useMemo(
    () => list.categories.find((c) => c.id === selectedId) ?? null,
    [list, selectedId]
  );

  const totalSolved = useMemo(
    () =>
      list.categories.reduce(
        (acc, c) => acc + c.problems.filter((p) => solved.has(p.n)).length,
        0
      ),
    [list, solved]
  );
  const pct = list.total ? Math.round((totalSolved / list.total) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-3 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-xs text-fgMuted">
            {t('progress', { done: totalSolved, total: list.total, pct })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fgMuted">{t('listLabel')}</span>
          <Select
            value={listId}
            onValueChange={(v) => {
              setListId(v);
              setSelectedId(null);
            }}
            className="w-44"
            aria-label={t('listLabel')}
          >
            {LISTS.map((l) => (
              <SelectOption key={l.id} value={l.id}>
                {l.name}
              </SelectOption>
            ))}
          </Select>
        </div>
      </header>

      <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-primary-grad" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1">
          <RoadmapTree
            list={list}
            solved={solved}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        {selectedCategory ? (
          <CategoryPanel
            category={selectedCategory}
            solved={solved}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
