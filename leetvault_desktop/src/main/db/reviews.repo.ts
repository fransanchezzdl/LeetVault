import type { Problem } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';
import { applySm2 } from '../domain/sm2';
import { stmts } from './statements';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const ReviewsRepo = {
  due(): Problem[] {
    return stmts().selectDue.all(todayISO()) as Problem[];
  },
  countDue(): number {
    const row = stmts().countDue.get(todayISO()) as { n: number };
    return row.n;
  },
  nextDate(): string | null {
    const row = stmts().selectNextReview.get(todayISO()) as
      | { sr_next_review: string }
      | undefined;
    return row?.sr_next_review ?? null;
  },
  rate(id: number, quality: Quality): void {
    const row = stmts().selectSrFields.get(id) as
      | { sr_interval: number; sr_repetitions: number; sr_ease: number }
      | undefined;
    if (!row) return;

    const next = applySm2(
      {
        interval: row.sr_interval,
        repetitions: row.sr_repetitions,
        ease: row.sr_ease,
      },
      quality
    );

    stmts().updateSr.run({
      id,
      sr_interval: next.interval,
      sr_repetitions: next.repetitions,
      sr_ease: next.ease,
      sr_next_review: next.nextReviewISO,
    });
  },
  finish(id: number): void {
    stmts().clearSr.run(id);
  },
};
