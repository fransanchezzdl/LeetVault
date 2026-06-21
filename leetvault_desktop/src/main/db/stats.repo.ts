import type {
  DateCount,
  DifficultyCount,
  PatternCount,
  StatsBundle,
} from '@shared/types/stats';
import { stmts } from './statements';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const StatsRepo = {
  bundle(): StatsBundle {
    const today = todayISO();
    const total = (stmts().countAll.get() as { n: number }).n;
    const by_difficulty = stmts().groupByDifficulty.all() as DifficultyCount[];
    const by_pattern = stmts().groupByPattern.all() as PatternCount[];
    const by_date = stmts().groupByDate.all() as DateCount[];
    const due_reviews = (stmts().countDue.get(today) as { n: number }).n;
    const nextRow = stmts().selectNextReview.get(today) as
      | { sr_next_review: string }
      | undefined;
    return {
      total,
      by_difficulty,
      by_pattern,
      by_date,
      due_reviews,
      next_review: nextRow?.sr_next_review ?? null,
    };
  },
};
