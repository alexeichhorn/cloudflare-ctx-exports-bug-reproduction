import { ExecutorService } from './services/executor';

export { OutboundProbe } from './services/executor';

export default {
  async queue(_batch: MessageBatch<unknown>, _env: Env): Promise<void> {},

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      return new ExecutorService(env, ctx).runProbe();
    }

    return new Response('FROM_INDEX_DEFAULT');
  },
} satisfies ExportedHandler<Env>;

interface Env {
  LOADER: WorkerLoader;
}
