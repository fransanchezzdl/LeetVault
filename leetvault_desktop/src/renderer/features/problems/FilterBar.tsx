import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUi } from '../../store/ui';
import { Input } from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';

export function FilterBar() {
  const { t } = useTranslation(['problems', 'common']);
  const { search, setSearch, difficulty, setDifficulty, status, setStatus, pattern, setPattern } =
    useUi();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg/[0.68]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('problems:filters.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      <Select
        value={difficulty}
        onValueChange={(v) => setDifficulty(v as typeof difficulty)}
        className="w-36"
        aria-label={t('problems:filters.difficulty')}
      >
        <SelectOption value="all">{t('problems:filters.difficulty')}</SelectOption>
        <SelectOption value="Easy">Easy</SelectOption>
        <SelectOption value="Medium">Medium</SelectOption>
        <SelectOption value="Hard">Hard</SelectOption>
      </Select>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as typeof status)}
        className="w-40"
        aria-label={t('problems:filters.status')}
      >
        <SelectOption value="all">{t('problems:filters.status')}</SelectOption>
        <SelectOption value="Solved">{t('common:status.Solved')}</SelectOption>
        <SelectOption value="In Progress">{t('common:status.InProgress')}</SelectOption>
        <SelectOption value="To Review">{t('common:status.ToReview')}</SelectOption>
      </Select>

      {pattern ? (
        <button
          type="button"
          onClick={() => setPattern('')}
          className="inline-flex items-center gap-1 rounded-full border border-glass-stroke/10 bg-fg/5 px-3 py-1 text-xs text-fgSoft hover:bg-fg/10"
        >
          {t('problems:filters.patternLabel')} <span className="font-medium">{pattern}</span>
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
