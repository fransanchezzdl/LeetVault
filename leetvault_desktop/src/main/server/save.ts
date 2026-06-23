import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ProblemDraft } from '@shared/types/problem';
import { ProblemsRepo } from '../db/problems.repo';
import { broadcast } from '../events/bus';
import { IpcChannels } from '@shared/ipc-channels';
import { capture } from '../analytics/posthog';

export const MAX_BODY = 1 * 1024 * 1024;
const MAX_TITLE = 300;
const MAX_PATTERN = 100;
const MAX_NOTES = 50_000;
const MAX_SOLUTION = 200_000;
const MAX_DATE = 10;

const VALID_DIFFICULTY = new Set(['Easy', 'Medium', 'Hard']);
const VALID_STATUS = new Set(['Solved', 'In Progress', 'To Review']);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function strOf(v: unknown, fallback = ''): string {
  return (typeof v === 'string' ? v : v == null ? fallback : String(v)).trim();
}

export async function handleSave(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = req.body as unknown;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return void reply.code(400).send({ error: 'Invalid payload' });
  }

  const b = body as Record<string, unknown>;

  let number: number | null = null;
  if (b.number != null) {
    if (typeof b.number !== 'number' || !Number.isInteger(b.number) || b.number < 1 || b.number > 9999) {
      return void reply.code(400).send({ error: 'Invalid problem number' });
    }
    number = b.number;
  }

  const title = strOf(b.title).slice(0, MAX_TITLE);
  if (!title) return void reply.code(400).send({ error: 'Title is required' });

  let difficulty = strOf(b.difficulty, 'Medium');
  if (!VALID_DIFFICULTY.has(difficulty)) difficulty = 'Medium';

  const pattern = strOf(b.pattern).slice(0, MAX_PATTERN);

  let status = strOf(b.status, 'Solved');
  if (!VALID_STATUS.has(status)) status = 'Solved';

  const solution = strOf(b.solution).slice(0, MAX_SOLUTION);
  const notes = strOf(b.notes).slice(0, MAX_NOTES);

  let date_solved = strOf(b.date_solved).slice(0, MAX_DATE);
  if (date_solved && !DATE_RE.test(date_solved)) date_solved = '';

  const draft: ProblemDraft = {
    number: number ?? undefined,
    title,
    difficulty: difficulty as ProblemDraft['difficulty'],
    pattern: pattern || undefined,
    status: status as ProblemDraft['status'],
    solution: solution || undefined,
    notes: notes || undefined,
    date_solved: date_solved || undefined,
  };

  const existing = number != null ? ProblemsRepo.getByNumber(number) : null;

  if (existing) {
    ProblemsRepo.update(existing.id, draft);
    broadcast(IpcChannels.Events.ProblemsChanged, {
      source: 'extension',
      action: 'updated',
      id: existing.id,
    });
    capture('extension_saved', { action: 'updated' });
    return void reply.send({ saved: true, action: 'updated', id: existing.id });
  }

  const { id } = ProblemsRepo.create(draft);
  broadcast(IpcChannels.Events.ProblemsChanged, {
    source: 'extension',
    action: 'created',
    id,
  });
  capture('extension_saved', { action: 'created' });
  reply.send({ saved: true, action: 'created' });
}
