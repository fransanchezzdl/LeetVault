import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import type { Difficulty, Status } from '@shared/types/problem';

const diffMap: Record<Difficulty, string> = {
  Easy: 'bg-diff-easy/15 text-diff-easy',
  Medium: 'bg-diff-medium/15 text-diff-medium',
  Hard: 'bg-diff-hard/15 text-diff-hard',
};

export function DifficultyBadge({ value }: { value: Difficulty }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', diffMap[value])}>
      {value}
    </span>
  );
}

const statusMap: Record<Status, string> = {
  Solved: 'bg-status-solved/15 text-status-solved',
  'In Progress': 'bg-status-inprogress/15 text-status-inprogress',
  'To Review': 'bg-status-toreview/15 text-status-toreview',
};

const STATUS_KEY: Record<Status, string> = {
  Solved: 'status.Solved',
  'In Progress': 'status.InProgress',
  'To Review': 'status.ToReview',
};

export function StatusBadge({ value }: { value: Status }) {
  const { t } = useTranslation('common');
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusMap[value])}>
      {t(STATUS_KEY[value])}
    </span>
  );
}
