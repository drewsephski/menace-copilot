# Menace Hosted AI Gateway

The gateway at `/api/v1/chat/completions` proxies licensed desktop clients to OpenRouter with server-side controls.

## Quota and rate limits

Per-license limits are enforced in durable storage (Vercel KV / Upstash Redis):

- **Requests per minute** — `RATE_LIMIT_MAX_REQUESTS` (default 30/min)
- **Daily requests** — `DAILY_REQUEST_LIMIT` (default 500/day)
- **Daily token budget** — estimated input + capped output tokens (`DAILY_TOKEN_BUDGET`, default 250k/day)
- **Max output tokens** — hard-capped server-side (`MAX_OUTPUT_TOKENS`, default 4096)

License keys are never logged. Quota identifiers use a SHA-256 hash of the license key.

If quota storage is unavailable, the gateway returns **503** and does not proxy upstream — unless durable quota storage was never configured, in which case the gateway runs in **fail-open** mode for beta (set `MENACE_QUOTA_FAIL_OPEN=0` to enforce strict blocking).

## Model policy

The production model is selected server-side (`MENACE_GATEWAY_MODEL` or default `google/gemini-3.5-flash-lite`). Client `model` fields are ignored.

## Residual abuse surface

The desktop client sends fully-formed `messages` arrays (including system content) because prompts are assembled in the app. A modified client with a valid license could still attempt generic proxy usage by supplying arbitrary system/user messages.

Mitigations for beta:

- Server-selected model only (no arbitrary OpenRouter model routing)
- Blocked proxy fields (`provider`, `tools`, `response_format`, etc.)
- Message count, size, and image limits
- Hosted-AI entitlement verification via Polar
- Durable per-license request and token quotas (financial exposure is bounded per key)

Full protocol lockdown would require moving prompt assembly server-side; that is out of scope for this beta.

## Defense in depth

Set an account-level monthly spend ceiling in the [OpenRouter limits dashboard](https://openrouter.ai/settings/limits) so a quota bug cannot create unbounded provider spend.

## Required Vercel environment variables

- `OPENROUTER_API_KEY`
- `POLAR_ORGANIZATION_ID`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)
