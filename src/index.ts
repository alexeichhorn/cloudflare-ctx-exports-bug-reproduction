export { CachedFetchService } from './services/executor';

export default {
  async queue(_batch: MessageBatch<unknown>, _env: Env): Promise<void> {},

  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      const directRpc = await ctx.exports.CachedFetchService({}).someOtherFunc();
      const directFetchText = await (await ctx.exports.CachedFetchService({}).fetch(new Request('https://losjet.com'))).text();

      const worker = env.LOADER.get('repro-worker', () => ({
        compatibilityDate: '2026-02-25',
        compatibilityFlags: ['nodejs_compat'],
        mainModule: 'main.js',
        modules: {
          'main.js': {
            js: `
              export default {
                async fetch(request, env) {
                  const __jobstepOriginalFetch = globalThis.fetch.bind(globalThis);
                  const __jobstepFetch = __jobstepOriginalFetch;
                  globalThis.fetch = __jobstepFetch;
                  const fetch = __jobstepFetch;
                  try {
                    const r = await fetch('https://example.com/from-loader');
                    const text = await r.text();
                    return new Response(JSON.stringify({ text }), {
                      headers: { 'content-type': 'application/json' },
                    });
                  } finally {
                    globalThis.fetch = __jobstepOriginalFetch;
                  }
                }
              };
            `,
          },
        },
        globalOutbound: ctx.exports.CachedFetchService({}),
      }));

      const loaderResponse = await worker.getEntrypoint().fetch('https://loader-entry/probe');
      const loaderJson = (await loaderResponse.json()) as { text: string };

      return Response.json({
        directRpc,
        directFetchText,
        loaderFetchText: loaderJson.text,
        note: 'If this were hitting CachedFetchService.fetch, both fetch texts should start with FROM_OUTBOUND_CLASS.',
      });
    }

    return new Response('FROM_INDEX_DEFAULT');
  },
} satisfies ExportedHandler<Env>;
