import { useDeferredValue, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { useUi } from '../../store/ui';
import { FilterBar } from './FilterBar';
import { ProblemsTable } from './ProblemsTable';
import { ProblemFormDialog } from './ProblemFormDialog';
import { DeleteProblemDialog } from './DeleteProblemDialog';
import { useProblems } from './hooks';

export function ProblemsView() {
  const { t } = useTranslation(['problems', 'common']);
  const { search, difficulty, status, pattern } = useUi();
  const openCreate = useUi((s) => s.openCreate);
  const { data: problems = [], isLoading } = useProblems();
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (pattern && (p.pattern ?? '').toLowerCase() !== pattern.toLowerCase()) return false;
      if (!q) return true;
      const num = p.number?.toString() ?? '';
      return (
        p.title.toLowerCase().includes(q) ||
        num.includes(q) ||
        (p.pattern ?? '').toLowerCase().includes(q)
      );
    });
  }, [problems, deferredSearch, difficulty, status, pattern]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('problems:title')}</h1>
          <p className="text-xs text-fgMuted">
            {isLoading
              ? t('common:common.loading')
              : t('problems:count', { count: problems.length, filtered: filtered.length, total: problems.length })}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> {t('problems:new')}
        </Button>
      </header>

      <FilterBar />

      <div className="flex-1 min-h-0">
        <ProblemsTable problems={filtered} />
      </div>

      <ProblemFormDialog />
      <DeleteProblemDialog />
    </div>
  );
}
