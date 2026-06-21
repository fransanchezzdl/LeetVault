import { z } from 'zod';

const ExampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  note: z.string().optional(),
});

export const InterviewProblemSchema = z.object({
  id: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  title: z.string().min(3),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  topics: z.array(z.string().min(1)).min(1),
  vague_description: z.string().min(20),
  full_constraints: z.string().min(20),
  twists: z.array(z.string().min(5)),
  expected_solution: z.string().min(40),
  expected_complexity: z.object({
    time: z.string().min(2),
    space: z.string().min(2),
  }),
  examples: z.array(ExampleSchema).min(1),
});

export const InterviewProblemListSchema = z.array(InterviewProblemSchema).superRefine((list, ctx) => {
  const ids = new Set<string>();
  for (const p of list) {
    if (ids.has(p.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate problem id: ${p.id}`,
        path: ['id'],
      });
    }
    ids.add(p.id);
  }
});
