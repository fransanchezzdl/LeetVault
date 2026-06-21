import type {
  InterviewDifficulty,
  InterviewProblem,
  InterviewProblemPublic,
} from '@shared/types/interview';
import { INTERVIEW_PROBLEMS } from './problems';

export function publicView(p: InterviewProblem): InterviewProblemPublic {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    vague_description: p.vague_description,
    examples: p.examples,
  };
}

export function pickProblem(
  difficulty: InterviewDifficulty | 'unknown',
  excludeIds: ReadonlySet<string> = new Set()
): InterviewProblem | null {
  const pool = INTERVIEW_PROBLEMS.filter(
    (p) => (difficulty === 'unknown' || p.difficulty === difficulty) && !excludeIds.has(p.id)
  );
  if (pool.length === 0) {
    // Fall back to the full filter without exclusions if everything has been seen.
    const fallback = INTERVIEW_PROBLEMS.filter(
      (p) => difficulty === 'unknown' || p.difficulty === difficulty
    );
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getProblemById(id: string): InterviewProblem | undefined {
  return INTERVIEW_PROBLEMS.find((p) => p.id === id);
}
