import { WorkerEntrypoint } from 'cloudflare:workers';

export class OutboundProbe extends WorkerEntrypoint<Cloudflare.Env, {}> {
  async fetch(_request: Request): Promise<Response> {
    console.log('[OutboundProbe.fetch] URL:', _request.url, 'mode:', 'no-props');
    return new Response(`FROM_OUTBOUND_CLASS mode=no-props url=${_request.url}`);
  }

  someOtherFunc(): string {
    return 'FROM_RPC_METHOD mode=no-props';
  }
}
