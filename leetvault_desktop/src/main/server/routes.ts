import type { FastifyInstance } from 'fastify';
import { ProblemsRepo } from '../db/problems.repo';
import { StatsRepo } from '../db/stats.repo';
import { ReviewsRepo } from '../db/reviews.repo';
import { handleSave } from './save';

export function registerRoutes(app: FastifyInstance): void {
  app.get('/status', async () => ({ status: 'ok', app: 'LeetVault' }));

  app.get('/api/problems', async () => ({ problems: ProblemsRepo.list() }));

  app.get('/api/stats', async () => {
    const bundle = StatsRepo.bundle();
    return {
      stats: {
        total: bundle.total,
        by_difficulty: bundle.by_difficulty,
        by_pattern: bundle.by_pattern,
        by_date: bundle.by_date,
      },
      due_reviews: ReviewsRepo.countDue(),
      next_review: ReviewsRepo.nextDate(),
    };
  });

  app.get<{ Params: { n: string } }>('/problem/:n', async (req, reply) => {
    const raw = req.params.n;
    if (!/^\d+$/.test(raw)) {
      return reply.code(400).send({ error: 'Invalid problem number' });
    }
    const n = Number(raw);
    if (n < 1 || n > 9999) {
      return reply.code(400).send({ error: 'Invalid problem number' });
    }
    const problem = ProblemsRepo.getByNumber(n);
    return problem ? { found: true, problem } : { found: false };
  });

  app.post('/save', handleSave);

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ error: 'Not found' });
  });

  app.setErrorHandler((err, req, reply) => {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 413) {
      return reply.code(413).send({ error: 'Payload too large' });
    }
    const hasValidation = typeof err === 'object' && err !== null && 'validation' in err;
    if (hasValidation || code === 400) {
      return reply.code(400).send({ error: 'Invalid JSON' });
    }
    req.log.error({ err }, 'unhandled server error');
    reply.code(500).send({ error: 'Internal error' });
  });
}
