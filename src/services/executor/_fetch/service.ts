import { WorkerEntrypoint } from 'cloudflare:workers';

export class CachedFetchService extends WorkerEntrypoint {
  async fetch(request: Request): Promise<Response> {
    console.log('[CachedFetchService.fetch] URL:', request.url, 'mode:', 'no-props');
    return new Response(`FROM_OUTBOUND_CLASS mode=no-props url=${request.url}`);
  }

  someOtherFunc(): string {
    return 'FROM_RPC_METHOD mode=no-props';
  }
}
