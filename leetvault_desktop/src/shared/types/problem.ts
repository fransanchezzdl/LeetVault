export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Status = 'Solved' | 'In Progress' | 'To Review';

export interface Problem {
  id: number;
  number: number | null;
  title: string;
  difficulty: Difficulty;
  pattern: string | null;
  status: Status;
  solution: string | null;
  notes: string | null;
  date_solved: string | null;
  sr_interval: number;
  sr_repetitions: number;
  sr_ease: number;
  sr_next_review: string | null;
  created_at: string;
}

export interface ProblemDraft {
  number?: number | null;
  title: string;
  difficulty: Difficulty;
  pattern?: string | null;
  status?: Status;
  solution?: string | null;
  notes?: string | null;
  date_solved?: string | null;
}
