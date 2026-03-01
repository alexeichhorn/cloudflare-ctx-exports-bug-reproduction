# Repro: `placement` misroutes `ctx.exports` fetch

This repo reproduces a production-only Cloudflare Workers issue.

The `/probe` route calls the same entrypoint in two ways:

- `ctx.exports.OutboundProbe({}).someOtherFunc()` (RPC method)
- `ctx.exports.OutboundProbe({}).fetch(new Request(...))` (fetch method)

Observed behavior:

- Local dev: both calls behave correctly.
- Production with `placement` enabled: RPC call still works, but `ctx.exports...fetch(...)` is misrouted to main `index.fetch` and returns `FROM_INDEX_DEFAULT`.

## Trigger

- Keeping `placement` enabled reproduces the issue in production.
- Removing `placement` makes production behave like local.
- Changing placement region in Cloudflare dashboard (for example US/Asia/EU) still reproduces the same issue while `placement` is enabled. (→ not region-specific)

## Endpoint

`/probe` runs both calls and returns JSON:

- `directRpc` (RPC method call)
- `directFetchText` (`ctx.exports` fetch call result)

## Expected vs actual

Expected (correct behavior):

```json
{
  "directRpc": "FROM_RPC_METHOD ...",
  "directFetchText": "FROM_OUTBOUND_CLASS ..."
}
```

Actual in production when `placement` is enabled:

```json
{
  "directRpc": "FROM_RPC_METHOD ...",
  "directFetchText": "FROM_INDEX_DEFAULT"
}
```

## Quick check

Local:

```bash
npm install
npm run dev
curl -sS http://127.0.0.1:8787/probe | jq
```

Prod:

```bash
curl -sS "https://<your-worker-url>/probe" | jq
```

Current deployed repro URL:

```bash
curl -sS "https://cloudflare-ctx-exports-bug-reproduction.white-meadow-a345.workers.dev/probe" | jq
```
