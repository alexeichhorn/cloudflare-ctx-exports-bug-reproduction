import { WorkerEntrypoint } from 'cloudflare:workers';

export class OutboundProbe extends WorkerEntrypoint {
  private readonly cacheDuration = 3600;

  async fetch(request: Request): Promise<Response> {
    console.log('[OutboundProbe.fetch] URL:', request.url, 'mode:', 'no-props');
    return new Response(`FROM_OUTBOUND_CLASS mode=no-props url=${request.url}`);
  }

  someOtherFunc(): string {
    return 'FROM_RPC_METHOD mode=no-props';
  }
}

export default {
  async queue(_batch: MessageBatch<unknown>, _env: Env): Promise<void> {},

  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      const directRpc = await ctx.exports.OutboundProbe({}).someOtherFunc();
      const directFetchText = await (await ctx.exports.OutboundProbe({}).fetch(new Request('https://example.com/repro'))).text();

      const worker = env.LOADER.get('repro-worker', () => ({
        compatibilityDate: '2026-02-25',
        compatibilityFlags: ['nodejs_compat'],
        mainModule: 'main.js',
        modules: {
          'main.js': {
            js: `
              export default {
                async fetch() {
                  const r = await fetch('https://example.com/from-loader');
                  const text = await r.text();
                  return new Response(JSON.stringify({ text }), {
                    headers: { 'content-type': 'application/json' },
                  });
                }
              };
            `,
          },
        },
        globalOutbound: ctx.exports.OutboundProbe({}),
      }));

      const loaderResponse = await worker.getEntrypoint().fetch('https://loader-entry/probe');
      const loaderJson = (await loaderResponse.json()) as { text: string };

      return Response.json({
        directRpc,
        directFetchText,
        loaderFetchText: loaderJson.text,
        note: 'If this were hitting OutboundProbe.fetch, both fetch texts should start with FROM_OUTBOUND_CLASS.',
      });
    }

    return new Response('FROM_INDEX_DEFAULT');
  },
} satisfies ExportedHandler<Env>;
