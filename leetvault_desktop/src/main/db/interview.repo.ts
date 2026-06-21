import { getDb } from './connection';
import type {
  InterviewDifficulty,
  InterviewDifficultyCount,
  InterviewEvaluation,
  InterviewLanguage,
  InterviewLanguageCount,
  InterviewRecent,
  InterviewSessionSummary,
  InterviewStatsBundle,
  InterviewVerdictCount,
} from '@shared/types/interview';

export interface InterviewInsertArgs {
  problemId: string;
  difficulty: InterviewDifficulty;
  language: InterviewLanguage;
  durationSec: number;
  finalCode: string;
  evaluationJson: string | null;
  startedAt: string;
  finishedAt: string;
}

export const InterviewRepo = {
  insert(args: InterviewInsertArgs): number {
    const info = getDb()
      .prepare(
        `INSERT INTO interview_sessions
          (problem_id, difficulty, language, duration_sec, final_code,
           evaluation_json, started_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        args.problemId,
        args.difficulty,
        args.language,
        args.durationSec,
        args.finalCode,
        args.evaluationJson,
        args.startedAt,
        args.finishedAt
      );
    return Number(info.lastInsertRowid);
  },

  list(limit = 50): InterviewSessionSummary[] {
    const rows = getDb()
      .prepare(
        `SELECT id, problem_id, difficulty, language, duration_sec,
                started_at, finished_at, evaluation_json
         FROM interview_sessions
         ORDER BY started_at DESC
         LIMIT ?`
      )
      .all(limit) as Array<{
      id: number;
      problem_id: string;
      difficulty: InterviewDifficulty;
      language: InterviewLanguage;
      duration_sec: number;
      started_at: string;
      finished_at: string | null;
      evaluation_json: string | null;
    }>;

    return rows.map((r) => ({
      id: r.id,
      problemId: r.problem_id,
      difficulty: r.difficulty,
      language: r.language,
      durationSec: r.duration_sec,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      overall: extractOverall(r.evaluation_json),
    }));
  },

  recentProblemIds(limit = 5): string[] {
    const rows = getDb()
      .prepare(
        `SELECT DISTINCT problem_id FROM interview_sessions
         ORDER BY started_at DESC LIMIT ?`
      )
      .all(limit) as { problem_id: string }[];
    return rows.map((r) => r.problem_id);
  },

  aggregates(): InterviewStatsBundle {
    const db = getDb();
    const totalsRow = db
      .prepare(
        `SELECT COUNT(*) AS total, COALESCE(SUM(duration_sec), 0) AS total_sec
         FROM interview_sessions`
      )
      .get() as { total: number; total_sec: number };

    const total = totalsRow.total;
    const totalSeconds = totalsRow.total_sec;
    const avgDurationSec = total > 0 ? Math.round(totalSeconds / total) : 0;

    const diffRows = db
      .prepare(
        `SELECT difficulty, COUNT(*) AS cnt
         FROM interview_sessions
         GROUP BY difficulty`
      )
      .all() as { difficulty: InterviewDifficulty; cnt: number }[];
    const byDifficulty: InterviewDifficultyCount[] = diffRows.map((r) => ({
      difficulty: r.difficulty,
      cnt: r.cnt,
    }));

    const langRows = db
      .prepare(
        `SELECT language, COUNT(*) AS cnt
         FROM interview_sessions
         GROUP BY language
         ORDER BY cnt DESC`
      )
      .all() as { language: InterviewLanguage; cnt: number }[];
    const byLanguage: InterviewLanguageCount[] = langRows.map((r) => ({
      language: r.language,
      cnt: r.cnt,
    }));

    const recentRows = db
      .prepare(
        `SELECT id, problem_id, difficulty, language, duration_sec,
                started_at, evaluation_json
         FROM interview_sessions
         ORDER BY started_at DESC
         LIMIT 8`
      )
      .all() as Array<{
      id: number;
      problem_id: string;
      difficulty: InterviewDifficulty;
      language: InterviewLanguage;
      duration_sec: number;
      started_at: string;
      evaluation_json: string | null;
    }>;
    const recent: InterviewRecent[] = recentRows.map((r) => ({
      id: r.id,
      problemId: r.problem_id,
      difficulty: r.difficulty,
      language: r.language,
      durationSec: r.duration_sec,
      startedAt: r.started_at,
      overall: extractOverall(r.evaluation_json),
    }));

    // Verdict + score averages need to walk the JSON blobs. We pull every row
    // once (no JSON1 dependency) — interview history is bounded by user pace
    // (~10s-100s of rows), so the cost is negligible compared to the network
    // round-trips that produced them.
    const allRows = db
      .prepare(`SELECT evaluation_json FROM interview_sessions`)
      .all() as { evaluation_json: string | null }[];

    const verdictMap = new Map<NonNullable<InterviewEvaluation['overall']>, number>();
    let scoredCount = 0;
    const scoreSum = {
      communication: 0,
      problem_solving: 0,
      code_quality: 0,
      complexity_analysis: 0,
    };

    for (const row of allRows) {
      if (!row.evaluation_json) continue;
      try {
        const obj = JSON.parse(row.evaluation_json) as Partial<InterviewEvaluation>;
        if (obj.overall) {
          verdictMap.set(obj.overall, (verdictMap.get(obj.overall) ?? 0) + 1);
        }
        if (obj.scores) {
          scoredCount += 1;
          scoreSum.communication += obj.scores.communication ?? 0;
          scoreSum.problem_solving += obj.scores.problem_solving ?? 0;
          scoreSum.code_quality += obj.scores.code_quality ?? 0;
          scoreSum.complexity_analysis += obj.scores.complexity_analysis ?? 0;
        }
      } catch {
        // Ignore malformed evaluator output — counted in total but not avgs.
      }
    }

    const byVerdict: InterviewVerdictCount[] = Array.from(verdictMap.entries()).map(
      ([verdict, cnt]) => ({ verdict, cnt })
    );

    const avgScores =
      scoredCount > 0
        ? {
            communication: scoreSum.communication / scoredCount,
            problem_solving: scoreSum.problem_solving / scoredCount,
            code_quality: scoreSum.code_quality / scoredCount,
            complexity_analysis: scoreSum.complexity_analysis / scoredCount,
          }
        : null;

    return {
      total,
      totalSeconds,
      avgDurationSec,
      scoredCount,
      avgScores,
      byVerdict,
      byDifficulty,
      byLanguage,
      recent,
    };
  },
};

function extractOverall(json: string | null): InterviewEvaluation['overall'] | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json) as { overall?: InterviewEvaluation['overall'] };
    return obj.overall ?? null;
  } catch {
    return null;
  }
}
