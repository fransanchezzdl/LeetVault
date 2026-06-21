export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewLanguage = 'python' | 'typescript' | 'javascript' | 'java' | 'cpp' | 'go';

export interface InterviewProblemExample {
  input: string;
  output: string;
  note?: string;
}

export interface InterviewProblem {
  id: string;
  title: string;
  difficulty: InterviewDifficulty;
  topics: string[];
  vague_description: string;
  full_constraints: string;
  twists: string[];
  expected_solution: string;
  expected_complexity: { time: string; space: string };
  examples: InterviewProblemExample[];
}

export type InterviewProblemPublic = Pick<
  InterviewProblem,
  'id' | 'title' | 'difficulty' | 'topics' | 'vague_description' | 'examples'
>;

export interface InterviewMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  ts: number;
}

export interface InterviewStartArgs {
  difficulty: InterviewDifficulty | 'unknown';
  language: InterviewLanguage;
  timerMin: number | null;
}

export interface InterviewStartResult {
  sessionId: string;
  problemPublic: InterviewProblemPublic;
}

export interface InterviewSendArgs {
  sessionId: string;
  text: string;
  code?: string;
  language?: InterviewLanguage;
}

export interface InterviewFinishArgs {
  sessionId: string;
  finalCode: string;
  language: InterviewLanguage;
  durationSec: number;
}

export interface InterviewEvaluation {
  overall: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire';
  scores: {
    communication: 1 | 2 | 3 | 4 | 5;
    problem_solving: 1 | 2 | 3 | 4 | 5;
    code_quality: 1 | 2 | 3 | 4 | 5;
    complexity_analysis: 1 | 2 | 3 | 4 | 5;
  };
  strengths: string[];
  improvements: string[];
  complexity_user: { time: string; space: string; correct: boolean };
  edge_cases_missed: string[];
  summary: string;
}

export interface InterviewFinishResult {
  evaluation: InterviewEvaluation | null;
  evaluationRaw?: string;
  problemFull: InterviewProblem;
}

export interface InterviewSessionSummary {
  id: number;
  problemId: string;
  difficulty: InterviewDifficulty;
  language: InterviewLanguage;
  durationSec: number;
  startedAt: string;
  finishedAt: string | null;
  overall: InterviewEvaluation['overall'] | null;
}

export type InterviewVerdict = InterviewEvaluation['overall'];

export interface InterviewVerdictCount {
  verdict: InterviewVerdict;
  cnt: number;
}

export interface InterviewDifficultyCount {
  difficulty: InterviewDifficulty;
  cnt: number;
}

export interface InterviewLanguageCount {
  language: InterviewLanguage;
  cnt: number;
}

export interface InterviewRecent {
  id: number;
  problemId: string;
  difficulty: InterviewDifficulty;
  language: InterviewLanguage;
  durationSec: number;
  startedAt: string;
  overall: InterviewVerdict | null;
}

export interface InterviewAvgScores {
  communication: number;
  problem_solving: number;
  code_quality: number;
  complexity_analysis: number;
}

export interface InterviewStatsBundle {
  total: number;
  totalSeconds: number;
  avgDurationSec: number;
  scoredCount: number;
  avgScores: InterviewAvgScores | null;
  byVerdict: InterviewVerdictCount[];
  byDifficulty: InterviewDifficultyCount[];
  byLanguage: InterviewLanguageCount[];
  recent: InterviewRecent[];
}
