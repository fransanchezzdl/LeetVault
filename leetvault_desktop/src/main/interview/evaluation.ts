import { z } from 'zod';
import type { InterviewEvaluation } from '@shared/types/interview';

const score = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const EvaluationSchema: z.ZodType<InterviewEvaluation> = z.object({
  overall: z.enum(['Strong Hire', 'Hire', 'Lean Hire', 'No Hire']),
  scores: z.object({
    communication: score,
    problem_solving: score,
    code_quality: score,
    complexity_analysis: score,
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  complexity_user: z.object({
    time: z.string(),
    space: z.string(),
    correct: z.boolean(),
  }),
  edge_cases_missed: z.array(z.string()),
  summary: z.string(),
});

/**
 * Tolerates leading/trailing whitespace, accidental code fences, or prose
 * around the JSON object. Returns null on unrecoverable parse failure.
 */
export function evaluationFromJson(raw: string): InterviewEvaluation | null {
  const stripped = stripFences(raw).trim();
  const candidate = extractFirstJsonObject(stripped) ?? stripped;
  try {
    const obj = JSON.parse(candidate);
    const parsed = EvaluationSchema.safeParse(obj);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inStr) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
