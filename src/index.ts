import { WorkerEntrypoint } from 'cloudflare:workers';

export class OutboundProbe extends WorkerEntrypoint {
  async fetch(request: Request): Promise<Response> {
    console.log('[OutboundProbe.fetch] URL:', request.url, 'mode:', 'no-props');
    return new Response(`FROM_OUTBOUND_CLASS mode=no-props url=${request.url}`);
  }

  someOtherFunc(): string {
    return 'FROM_RPC_METHOD mode=no-props';
  }
}

export default {
  async fetch(request, _env, ctx): Promise<Response> {
    const url = new URL(request.url);
    console.log('[index.fetch] URL:', request.url);

    if (url.pathname === '/probe') {
      const directRpc = await ctx.exports.OutboundProbe({}).someOtherFunc();
      const directFetchText = await (await ctx.exports.OutboundProbe({}).fetch(new Request('https://example.com/repro'))).text();

      return Response.json({
        directRpc,
        directFetchText,
        note: 'Direct ctx.exports fetch should hit OutboundProbe.fetch and start with FROM_OUTBOUND_CLASS.',
      });
    }

    return new Response('FROM_INDEX_DEFAULT');
  },
} satisfies ExportedHandler<Env>;
