export { OutboundProbe } from './services/executor';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      const runtimeContext: { exports: Cloudflare.Exports } = ctx;

      const directRpc = await runtimeContext.exports.OutboundProbe({}).someOtherFunc();
      const directFetchText = await (
        await runtimeContext.exports.OutboundProbe({}).fetch(new Request('https://example.com/repro'))
      ).text();

      const worker = env.LOADER.get('repro-worker', () => ({
        compatibilityDate: '2026-02-25',
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
        globalOutbound: runtimeContext.exports.OutboundProbe({}),
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

interface Env {
  LOADER: WorkerLoader;
}
