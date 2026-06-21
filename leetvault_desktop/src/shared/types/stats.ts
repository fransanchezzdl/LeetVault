export interface DifficultyCount {
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  cnt: number;
}

export interface PatternCount {
  pattern: string;
  cnt: number;
}

export interface DateCount {
  date_solved: string;
  cnt: number;
}

export interface StatsBundle {
  total: number;
  by_difficulty: DifficultyCount[];
  by_pattern: PatternCount[];
  by_date: DateCount[];
  due_reviews: number;
  next_review: string | null;
}
