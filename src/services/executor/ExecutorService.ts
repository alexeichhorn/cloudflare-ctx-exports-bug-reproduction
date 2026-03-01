interface ExecutorEnv {
  LOADER: WorkerLoader;
}

interface ScriptExecutorRuntimeContext {
  exports: Cloudflare.Exports;
}

export class ExecutorService {
  private readonly env: ExecutorEnv;
  private readonly runtimeContext: ScriptExecutorRuntimeContext;

  constructor(env: ExecutorEnv, runtimeContext: ScriptExecutorRuntimeContext) {
    this.env = env;
    this.runtimeContext = runtimeContext;
  }

  async runProbe(): Promise<Response> {
    const directRpc = await this.runtimeContext.exports.OutboundProbe({}).someOtherFunc();
    const directFetchText = await (
      await this.runtimeContext.exports.OutboundProbe({}).fetch(new Request('https://example.com/repro'))
    ).text();

    const worker = this.env.LOADER.get('repro-worker', () => ({
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
      globalOutbound: this.runtimeContext.exports.OutboundProbe({}),
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
}
