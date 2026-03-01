import { DurableObject } from 'cloudflare:workers';

export class ProbeDurableObject extends DurableObject {
  async fetch(_request: Request): Promise<Response> {
    return new Response('ok from probe durable object');
  }
}
