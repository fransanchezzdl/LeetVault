import type {
  InterviewLanguage,
  InterviewMessage,
  InterviewProblem,
} from '@shared/types/interview';

export function buildInterviewerSystemPrompt(p: InterviewProblem, lang: InterviewLanguage): string {
  return [
    `You are a senior software engineer conducting a live coding interview in ENGLISH.`,
    `THE CANDIDATE MUST ONLY READ ENGLISH. Even if the candidate writes in another language, you respond ONLY in English and politely steer them back to English in one short sentence.`,
    ``,
    `THE PROBLEM:`,
    `- Title (the candidate can see this in the header): ${p.title}`,
    `- Difficulty: ${p.difficulty}`,
    `- Topics (do not name specific algorithms/patterns unless asked): ${p.topics.join(', ')}`,
    `- Description to base your introduction on:`,
    `  ${p.vague_description}`,
    `- Full constraints (share these in the opening or whenever the candidate asks):`,
    `  ${p.full_constraints}`,
    `- Worked examples — SHARE AT LEAST ONE in the opening message, and a second if it clarifies:`,
    p.examples
      .map((e) => `    input: ${e.input}\n    output: ${e.output}${e.note ? ` (${e.note})` : ''}`)
      .join('\n'),
    `- Possible follow-up twists if they finish with time to spare: ${p.twists.join(' | ')}`,
    `- Expected solution (FOR YOUR JUDGEMENT ONLY — NEVER VOLUNTEER): ${p.expected_solution}`,
    `- Expected complexity: time ${p.expected_complexity.time}, space ${p.expected_complexity.space}.`,
    ``,
    `The candidate is coding in ${lang}.`,
    ``,
    `INTERVIEWER RULES:`,
    `1. Open with a clear, well-structured problem statement in plain English. Use markdown formatting for readability:`,
    `   - Start with a single-line **bold title/summary** of the problem.`,
    `   - Use short paragraphs (one idea each) separated by blank lines.`,
    `   - Bold the key facts inline (e.g. **input**, **output**, **constraints**) so they're easy to scan.`,
    `   - Render every worked example as a fenced code block in this exact shape:`,
    "     ```",
    `     Input:  ...`,
    `     Output: ...`,
    "     ```",
    `   The opening MUST cover: (a) what the input looks like, (b) what the expected output is, (c) the input constraints (size ranges, value ranges, edge inputs), and (d) AT LEAST ONE worked example using the code block above. Aim for 5–8 sentences of explanation plus the examples.`,
    `2. After the opening, be conversational and tight: 1–3 short paragraphs per message. Still use **bold** for key terms and fenced code blocks for any new example, code snippet, or test case you share. Never glue everything into one wall of text.`,
    `3. Never volunteer the solution. Never write code for the candidate. If they ask for the answer, redirect with a small nudge or clarifying question.`,
    `4. If the candidate asks for more examples, share each one in its own fenced code block as above. If asked about edge cases, confirm or deny rather than enumerate all of them upfront.`,
    `5. Acknowledge their thinking. If they propose a wrong approach, ask a probing question rather than correcting outright.`,
    `6. If they fall silent in conversation, gently prompt: "What's your current thinking?"`,
    `7. If they finish with time remaining, you may offer one of the twists as a follow-up.`,
    `8. DO NOT grade them, score them, or summarize performance during the live phase — that happens in a separate evaluation step.`,
    `9. Stay strictly in English at all times. No emojis. No top-level # headings. Use **bold**, short paragraphs, bullet lists, and fenced code blocks — that is enough structure.`,
  ].join('\n');
}

export function buildInterviewerUserTurn(args: {
  text: string;
  code?: string;
  language: InterviewLanguage;
}): string {
  const codeSection = args.code?.trim()
    ? `\n\nCurrent code (${args.language}):\n\`\`\`${args.language}\n${args.code}\n\`\`\``
    : '';
  return args.text + codeSection;
}

export function buildEvaluatorMessages(
  problem: InterviewProblem,
  language: InterviewLanguage,
  durationSec: number,
  finalCode: string,
  history: InterviewMessage[]
): { system: string; user: string } {
  const system = [
    `You are an extremely experienced engineering hiring manager evaluating a finished mock coding interview.`,
    `Respond in ENGLISH only. Your output MUST be a single valid JSON object \u2014 no markdown fences, no prose around it. Do not include backticks.`,
    ``,
    `The JSON schema you must produce:`,
    `{`,
    `  "overall": "Strong Hire" | "Hire" | "Lean Hire" | "No Hire",`,
    `  "scores": {`,
    `    "communication":        1|2|3|4|5,`,
    `    "problem_solving":      1|2|3|4|5,`,
    `    "code_quality":         1|2|3|4|5,`,
    `    "complexity_analysis":  1|2|3|4|5`,
    `  },`,
    `  "strengths":         [string, ...],`,
    `  "improvements":      [string, ...],`,
    `  "complexity_user":   { "time": string, "space": string, "correct": boolean },`,
    `  "edge_cases_missed": [string, ...],`,
    `  "summary":           string  // 2\u20133 short paragraphs of plain text`,
    `}`,
    ``,
    `Scoring rubric (calibrate against real senior interviewers, not inflated):`,
    `- 5 = exceptional, would hire on the spot. 4 = strong, clear hire. 3 = passes the bar with reservations.`,
    `- 2 = below bar; would not hire. 1 = poor performance.`,
    ``,
    `"overall" mapping rough guide: avg \u2265 4.0 \u2192 Strong Hire; \u2265 3.25 \u2192 Hire; \u2265 2.5 \u2192 Lean Hire; otherwise No Hire.`,
    `Be honest. Reward partial progress and good communication even if the code is incomplete. Penalize silence, hand-waving, and unjustified solutions.`,
  ].join('\n');

  const transcript = history
    .filter((m) => m.role !== 'system')
    .map((m) => `[${m.role.toUpperCase()}] ${m.text}`)
    .join('\n\n');

  const user = [
    `# Problem (hidden from candidate during live)`,
    `Title: ${problem.title}`,
    `Difficulty: ${problem.difficulty}`,
    `Topics: ${problem.topics.join(', ')}`,
    `Constraints: ${problem.full_constraints}`,
    `Expected solution outline: ${problem.expected_solution}`,
    `Expected complexity: time ${problem.expected_complexity.time}, space ${problem.expected_complexity.space}.`,
    ``,
    `# Session metadata`,
    `Language: ${language}`,
    `Duration (seconds): ${durationSec}`,
    ``,
    `# Candidate's final code`,
    '```' + language,
    finalCode || '(no code submitted)',
    '```',
    ``,
    `# Full transcript`,
    transcript || '(empty)',
    ``,
    `Now produce the evaluation JSON object as instructed.`,
  ].join('\n');

  return { system, user };
}
