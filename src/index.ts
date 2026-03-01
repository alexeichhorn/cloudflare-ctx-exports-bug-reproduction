import { ExecutorService } from './services/executor';

export { ProbeDurableObject } from './durable/ProbeDurableObject';
export { OutboundProbe } from './services/executor';

export default {
  async queue(_batch: MessageBatch<unknown>, _env: Env): Promise<void> {},

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      return runProbe(env, ctx);
    }

    return new Response('FROM_INDEX_DEFAULT');
  },
} satisfies ExportedHandler<Env>;

async function runProbe(env: Env, ctx: ExecutionContext): Promise<Response> {
  const service = new ExecutorService(env, ctx);
  return service.runProbe();
}
