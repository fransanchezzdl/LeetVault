import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const ALLOWED_PREFIX = 'chrome-extension://';

function applyCors(req: FastifyRequest, reply: FastifyReply): boolean {
  const origin = req.headers['origin'];
  const originStr = typeof origin === 'string' ? origin : '';

  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');

  if (!originStr) return true;

  if (originStr.startsWith(ALLOWED_PREFIX)) {
    reply.header('Access-Control-Allow-Origin', originStr);
    return true;
  }

  reply.code(403).send({ error: 'Forbidden' });
  return false;
}

export async function registerCors(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (req, reply) => {
    if (!applyCors(req, reply)) return reply;
    if (req.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });
}
