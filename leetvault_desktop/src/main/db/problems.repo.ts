import type { Problem, ProblemDraft } from '@shared/types/problem';
import { stmts } from './statements';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const ProblemsRepo = {
  list(): Problem[] {
    return stmts().selectAllOrdered.all() as Problem[];
  },
  get(id: number): Problem | null {
    return (stmts().selectById.get(id) as Problem | undefined) ?? null;
  },
  getByNumber(number: number): Problem | null {
    return (stmts().selectByNumber.get(number) as Problem | undefined) ?? null;
  },
  create(d: ProblemDraft): { id: number } {
    const today = todayISO();
    const status = d.status ?? 'Solved';
    const info = stmts().insertProblem.run({
      number: d.number ?? null,
      title: d.title,
      difficulty: d.difficulty,
      pattern: d.pattern ?? null,
      status,
      solution: d.solution ?? null,
      notes: d.notes ?? null,
      date_solved: d.date_solved ?? null,
      sr_next_review: status === 'To Review' ? today : null,
    });
    return { id: Number(info.lastInsertRowid) };
  },
  update(id: number, d: ProblemDraft): void {
    const today = todayISO();
    const prev = stmts().selectStatus.get(id) as { status: string } | undefined;
    const newStatus = d.status ?? 'Solved';

    stmts().updateProblem.run({
      id,
      number: d.number ?? null,
      title: d.title,
      difficulty: d.difficulty,
      pattern: d.pattern ?? null,
      status: newStatus,
      solution: d.solution ?? null,
      notes: d.notes ?? null,
      date_solved: d.date_solved ?? null,
    });

    if (newStatus === 'To Review' && prev?.status !== 'To Review') {
      stmts().enterReview.run(today, id);
    } else if (newStatus !== 'To Review' && prev?.status === 'To Review') {
      stmts().leaveReview.run(id);
    }
  },
  remove(id: number): void {
    stmts().deleteProblem.run(id);
  },
  byPattern(pattern: string): Problem[] {
    return stmts().selectByPattern.all(pattern) as Problem[];
  },
};
