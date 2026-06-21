export type Quality = 0 | 2 | 3 | 4 | 5;

export interface ReviewItem {
  id: number;
  number: number | null;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  pattern: string | null;
  notes: string | null;
  solution: string | null;
  sr_interval: number;
  sr_repetitions: number;
  sr_ease: number;
  sr_next_review: string | null;
}
