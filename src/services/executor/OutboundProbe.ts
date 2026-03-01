import { WorkerEntrypoint } from 'cloudflare:workers';

export class OutboundProbe extends WorkerEntrypoint<Cloudflare.Env, { label: string }> {
  fetch(request: Request): Response {
    console.log('[OutboundProbe.fetch] URL:', request.url, 'label:', this.ctx.props.label);
    return new Response(`FROM_OUTBOUND_CLASS label=${this.ctx.props.label} url=${request.url}`);
  }

  someOtherFunc(): string {
    return `FROM_RPC_METHOD label=${this.ctx.props.label}`;
  }
}
