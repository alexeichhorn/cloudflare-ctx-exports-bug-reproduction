# Cloudflare ctx.exports + worker loader `globalOutbound` repro

Minimal reproduction for confusing `ctx.exports`/`globalOutbound` behavior.

## What this does

- Exports a `WorkerEntrypoint` class `OutboundProbe` with:
  - `fetch()` returning `FROM_OUTBOUND_CLASS ...`
  - `someOtherFunc()` returning `FROM_RPC_METHOD ...`
- In default `fetch`, `/probe`:
  - calls `ctx.exports.OutboundProbe(...).someOtherFunc()`
  - calls `ctx.exports.OutboundProbe(...).fetch('https://example.com/repro')`
  - creates a worker loader with `globalOutbound` set to the same export
  - calls loader worker that performs `fetch('https://example.com/from-loader')`

## Run

```bash
npm install
npm run dev
```

Then call:

```bash
curl -sS http://127.0.0.1:8787/probe | jq
```

## Expected signal

- `directRpc` should be `FROM_RPC_METHOD ...` (RPC method works)
- `directFetchText` should start with `FROM_OUTBOUND_CLASS ...`
- `loaderFetchText` should start with `FROM_OUTBOUND_CLASS ...`
- Logs should include:
  - `[index.fetch] ...`
  - `[OutboundProbe.fetch] ...`

Expected JSON shape/value pattern:

```json
{
  "directRpc": "FROM_RPC_METHOD label=ctx-exports-probe",
  "directFetchText": "FROM_OUTBOUND_CLASS label=ctx-exports-probe url=https://example.com/repro",
  "loaderFetchText": "FROM_OUTBOUND_CLASS label=ctx-exports-probe url=https://example.com/from-loader",
  "note": "If this were hitting OutboundProbe.fetch, both fetch texts should start with FROM_OUTBOUND_CLASS."
}
```

## Observed on local dev (`wrangler dev`)

Confirmed output from:

```bash
curl -sS http://127.0.0.1:8787/probe | jq
```

```json
{
  "directRpc": "FROM_RPC_METHOD label=ctx-exports-probe",
  "directFetchText": "FROM_OUTBOUND_CLASS label=ctx-exports-probe url=https://example.com/repro",
  "loaderFetchText": "FROM_OUTBOUND_CLASS label=ctx-exports-probe url=https://example.com/from-loader",
  "note": "If this were hitting OutboundProbe.fetch, both fetch texts should start with FROM_OUTBOUND_CLASS."
}
```

## Observed on deployed worker (production)

TODO: run after deploy and paste output from:

```bash
curl -sS "https://<your-worker-url>/probe" | jq
```

## Deploy

```bash
npm run deploy
```
