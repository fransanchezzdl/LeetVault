import Fastify, { type FastifyInstance } from 'fastify';
import { registerCors } from './cors';
import { registerRoutes } from './routes';
import { MAX_BODY } from './save';
import { broadcast } from '../events/bus';
import { IpcChannels } from '@shared/ipc-channels';

export const SERVER_PORT = 7842;
export const SERVER_HOST = '127.0.0.1';

let _server: FastifyInstance | null = null;

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    bodyLimit: MAX_BODY,
  });
  await registerCors(app);
  registerRoutes(app);
  return app;
}

export async function startServer(): Promise<FastifyInstance> {
  const app = await buildServer();
  try {
    await app.listen({ port: SERVER_PORT, host: SERVER_HOST });
  } catch (err) {
    broadcast(IpcChannels.Events.ServerStatus, { port: SERVER_PORT, running: false });
    throw err;
  }
  _server = app;
  broadcast(IpcChannels.Events.ServerStatus, { port: SERVER_PORT, running: true });
  return app;
}

export async function stopServer(): Promise<void> {
  if (!_server) return;
  await _server.close();
  _server = null;
  broadcast(IpcChannels.Events.ServerStatus, { port: SERVER_PORT, running: false });
}
