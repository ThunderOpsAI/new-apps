# LLM Gateway SRS v3 — Production Ready

> Patches all gaps identified in v2 gap analysis. Changes from v2 are marked **[NEW]** or **[FIXED]**.

---

## 1. What Changed from v2

| Gap | Fix |
|---|---|
| No key revocation | `is_active` + `revoked_at` added to `api_keys` |
| Mid-stream error handling undefined | SSE error event format defined |
| Credit system missing | `credits` table + atomic deduction + pipeline step added |
| Circuit breaker no state machine | Half-open state + Redis storage + fail-open default |
| Fallback ignores capability | `capabilities[]` on `ModelConfig`, checked before fallback |
| Token estimation timing | Two-phase estimation defined |
| SHA-256 without salt | HMAC-SHA256 with server secret |
| No request ID | ULID generated at auth, threaded through pipeline |
| Cache privacy ambiguity | Shared cache (no `api_key_id`), explicit decision documented |
| Rate limits not tiered | Tier → RPM mapping table defined |
| Async logging no DLQ | File-based DLQ fallback defined |
| No observability | Structured JSON logs + 4 key metrics defined |
| No CORS policy | Fastify CORS config defined |
| No health check | `GET /health` defined |

---

## 2. Architecture

```plaintext
Client
  → Gateway API (Railway / Fastify)
      → CORS (fastify/cors)
      → Auth + Key Validation (HMAC-SHA256)
      → Rate Limit (Redis sliding window, per tier)
      → Credit Check (Redis atomic decrement)
      → Parse + Validate Request
      → Token Estimate (phase 1 — heuristic, pre-routing)
      → Routing Decision (pure function)
      → Cache Lookup (shared, prompt+params hash)
      → Prompt Optimisation (opt-in, 500ms timeout)
      → Provider Call (stream / non-stream)
          → Circuit Breaker (closed / open / half-open)
          → Fallback Chain (capability-matched)
      → Token Estimate (phase 2 — provider actual, post-response)
      → Response Return
      → Async Log (Redis queue → DB worker)
```

❌ No Vercel edge layer (removed in v2, confirmed removed in v3)

---

## 3. Core Components

### 3.1 Provider Adapter Interface

```ts
interface ModelConfig {
  id: string
  maxContextTokens: number
  inputCostPer1k: number     // cents
  outputCostPer1k: number    // cents
  capabilities: Capability[] // ['streaming', 'tool_use', 'vision', 'json_mode']
}

interface ProviderAdapter {
  id: string
  supportsStreaming: boolean
  models: ModelConfig[]

  formatRequest(input: NormalisedRequest): ProviderPayload
  call(payload: ProviderPayload): Promise<Response>
  stream(payload: ProviderPayload): AsyncIterable<Chunk>
  parseResponse(res: Response): NormalisedResponse
  parseError(err: unknown): GatewayError
}

type Capability = 'streaming' | 'tool_use' | 'vision' | 'json_mode' | 'function_calling'
```

---

### 3.2 Shared Type Definitions **[NEW]**

All types live in `/src/types/index.ts`:

```ts
interface NormalisedRequest {
  requestId: string       // ULID
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stream: boolean
  toolUse?: boolean
  capabilities: Capability[]   // derived from request shape
}

interface NormalisedResponse {
  id: string
  choices: Choice[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  provider: string
  cached: boolean
  latencyMs: number
}

interface GatewayError {
  code: string            // 'PROVIDER_ERROR' | 'RATE_LIMITED' | 'NO_CREDITS' | 'ALL_FALLBACKS_FAILED' | 'TIMEOUT'
  message: string
  requestId: string
  provider?: string
  retryable: boolean
}

interface RoutingDecision {
  provider: string
  model: string
  fallbackChain: FallbackEntry[]
  estimatedCostCents: number
  reasoning: string
}

interface FallbackEntry {
  provider: string
  model: string
  capabilityMatch: boolean
}

interface Chunk {
  delta: string
  finishReason?: string
}
```

---

### 3.3 Routing Engine

**Pure function** — no side effects, no I/O.

```ts
routeRequest(ctx: RoutingContext): RoutingDecision
```

**Inputs:**

```ts
interface RoutingContext {
  tokenCountEstimate: number
  taskType: 'chat' | 'completion' | 'tool_use' | 'vision'
  latencyPriority: 'low' | 'normal' | 'high'
  userTier: 'free' | 'pro' | 'enterprise'
  providerOverride?: string
  capabilities: Capability[]   // required capabilities derived from request
}
```

**Fallback chain rules:**
- Only providers whose `ModelConfig.capabilities` is a superset of `ctx.capabilities` are eligible
- If no fallback is capability-compatible, return `GatewayError` with `code: 'ALL_FALLBACKS_FAILED'` immediately (do not attempt incompatible provider)

---

### 3.4 Streaming

- Pass-through SSE from provider
- No caching for streaming requests
- Partial logging written **after stream closes** (either normally or on error)
- On provider error mid-stream, emit:

```
event: error
data: {"code":"PROVIDER_ERROR","message":"upstream disconnected","requestId":"<ulid>","retryable":true}

```

- On **client disconnect**, abort the upstream request immediately and write a partial log with `finish_reason: 'client_disconnected'`

---

### 3.5 Prompt Optimisation

- Disabled by default
- Enable per-request via `X-Optimise: true` header
- Timeout: 500ms — if exceeded, skip optimisation silently and proceed
- Optimisation must not alter the semantic meaning of messages
- Never applied to streaming requests where first-token latency is critical **[NEW]**

---

### 3.6 Token Estimation — Two Phase **[FIXED]**

**Phase 1 (pre-routing):** Used for routing decision and credit reservation.
- tiktoken for OpenAI/compatible models
- `charCount / 4` heuristic as universal fallback
- Used to determine context window fit and estimated cost

**Phase 2 (post-response):** Used for actual billing and logging.
- Use `usage` object from provider response (all major providers return this)
- If provider does not return usage, fall back to Phase 1 estimate
- Phase 2 value is what gets written to `request_logs`

---

### 3.7 Multi-Tenant Model **[FIXED]**

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL UNIQUE,   -- HMAC-SHA256(server_secret, raw_key)
  key_prefix  TEXT NOT NULL,          -- first 8 chars of raw key, for display
  tier        TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'enterprise'
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,  -- [NEW]
  revoked_at  TIMESTAMPTZ,                    -- [NEW]
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Credits (prepaid balance) [NEW]
CREATE TABLE credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Credit ledger (audit trail) [NEW]
CREATE TABLE credit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  delta_cents BIGINT NOT NULL,         -- negative = deduction, positive = top-up
  reason      TEXT NOT NULL,           -- 'request' | 'topup' | 'refund'
  request_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Request Logs (async write)
CREATE TABLE request_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT NOT NULL,          -- ULID [NEW]
  api_key_id      UUID NOT NULL REFERENCES api_keys(id),
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  tokens_in       INT NOT NULL,
  tokens_out      INT NOT NULL,
  cost_cents      INT NOT NULL,           -- from provider_pricing at time of request
  latency_ms      INT NOT NULL,
  cache_hit       BOOLEAN NOT NULL DEFAULT FALSE,
  finish_reason   TEXT,                   -- 'stop' | 'length' | 'client_disconnected' | 'error'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Pricing (seed data required)
CREATE TABLE provider_pricing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT NOT NULL,
  model               TEXT NOT NULL,
  input_cost_per_1k   NUMERIC(10,6) NOT NULL,   -- cents per 1k tokens
  output_cost_per_1k  NUMERIC(10,6) NOT NULL,
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, model, effective_from)
);
```

---

### 3.8 API Key Security **[FIXED]**

- Raw key is shown to user **once** on creation — never stored
- Format: `llmgw_<random_32_chars>`
- Stored as: `HMAC-SHA256(env.HMAC_SECRET, rawKey)` 
- `key_prefix` stores first 8 chars of raw key for user-facing display (e.g. `llmgw_ab...`)
- On revocation: set `is_active = false`, `revoked_at = NOW()`
- Revoked keys are rejected at auth with `401 { code: 'KEY_REVOKED' }`

---

### 3.9 Request ID **[NEW]**

- Generated as **ULID** (sortable, URL-safe, no hyphens)
- Generated at the **start of the auth middleware** — before any business logic
- Threaded through: auth → rate limit → router → cache → provider → logging
- Returned in every response: `X-Request-Id: <ulid>` header + `"id"` field in body
- Stored in `request_logs.request_id`
- Included in all structured log lines

---

### 3.10 Rate Limiting **[FIXED]**

Redis sliding window per `api_key_id`.

| Tier | RPM | Burst policy |
|---|---|---|
| free | 20 | No burst (strict window) |
| pro | 60 | No burst (strict window) |
| enterprise | 300 | Configurable per key |

Response on limit exceeded:
```json
{
  "error": { "code": "RATE_LIMITED", "message": "Rate limit exceeded", "retryAfter": 14, "requestId": "<ulid>" }
}
```
Headers: `Retry-After: 14`, `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining: 0`

---

### 3.11 Credit System **[NEW]**

**Atomicity via Redis:**
1. Before provider call: `DECRBY credits:{user_id} {estimated_cost_cents}` — if result < 0, reject with `402`
2. After provider call: reconcile using Phase 2 actual cost — adjust balance if estimate differed
3. Write `credit_events` record async (same queue as request log)

**Hard cutoff:** If `credits.balance_cents <= 0`, return:
```json
{ "error": { "code": "NO_CREDITS", "message": "Insufficient credits", "requestId": "<ulid>" } }
```
HTTP `402`

**Per-key spend cap (optional):** Stored in `api_keys.spend_cap_cents`. Checked against `SUM(cost_cents)` for the key in the current billing period.

---

### 3.12 Circuit Breaker **[FIXED]**

**State machine (3 states):**

```
CLOSED ──(>5 failures in 30s)──→ OPEN
OPEN   ──(after 60s)───────────→ HALF-OPEN
HALF-OPEN ──(probe succeeds)───→ CLOSED
HALF-OPEN ──(probe fails)──────→ OPEN
```

**Storage:** Redis hashes per provider:
```
circuit:{provider}:state        = 'closed' | 'open' | 'half-open'
circuit:{provider}:failures     = <count>  (TTL 30s, auto-expire)
circuit:{provider}:opened_at    = <timestamp>
```

**Fail behaviour on Redis outage:** Fail **open** (pass through to provider). Do not block requests due to observability infrastructure failure.

**Probe in half-open:** Allow exactly 1 request through. All others during half-open return `503` with `retryable: true`.

---

### 3.13 Cache **[FIXED]**

```
key = SHA-256(provider + model + temperature + max_tokens + messages_json)
```

**Decision: shared cross-tenant cache** (no `api_key_id` in key).

Rationale: maximises hit rate. Privacy implication: two users with identical prompts share a cached response — acceptable since responses contain no user PII.

Skip cache for:
- `stream: true`
- Requests containing `tools` or `tool_choice`
- Requests with `X-No-Cache: true` **[NEW]**
- Dynamic flags (random seed, explicit `temperature > 0.9`)

TTL: 1 hour default, configurable per model tier.

---

### 3.14 Async Logging **[FIXED]**

**Queue:** Redis `RPUSH logging:queue <json>` — non-blocking, fire-and-forget from request path.

**Worker:** Separate process (`/src/workers/logWriter.ts`) — polls `BLPOP logging:queue` and batch-inserts to Postgres.

**DLQ:** If Postgres write fails after 3 retries, write to `/var/log/llmgw/dlq.jsonl` (file-based fallback). Operator must monitor and replay.

**On Redis outage:** Log is silently dropped from async path. Request still succeeds. A warning is emitted to stdout.

---

### 3.15 Observability **[NEW]**

**Structured JSON logs** to stdout (Railway log drain picks up):

```json
{
  "ts": "2026-04-24T02:00:00Z",
  "level": "info",
  "requestId": "<ulid>",
  "event": "request_complete",
  "provider": "openai",
  "model": "gpt-4o",
  "latencyMs": 423,
  "cacheHit": false,
  "tokensIn": 120,
  "tokensOut": 340,
  "costCents": 2
}
```

**Key metrics to track (minimum viable):**

| Metric | Why |
|---|---|
| `request_latency_p95` | SLA monitoring |
| `provider_error_rate` | Circuit breaker trigger validation |
| `cache_hit_rate` | Cost optimisation signal |
| `token_throughput` | Capacity planning |

Use Fastify's `onResponse` hook to emit metrics. No external APM required for MVP; add Prometheus scrape endpoint in v4.

---

## 4. API Schema

### Request
```json
{
  "model": "gpt-4o",
  "messages": [{ "role": "user", "content": "..." }],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": false,
  "tools": []
}
```

### Response (non-streaming, OpenAI-compatible)
```json
{
  "id": "01J3XBK...",
  "choices": [{ "message": { "role": "assistant", "content": "..." }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300 },
  "provider": "openai",
  "cached": false
}
```
Headers: `X-Request-Id: <ulid>`, `X-Cache: HIT|MISS`, `X-Provider: openai`

### Response (streaming)
```
Content-Type: text/event-stream

data: {"id":"01J3..","delta":"Hello","finishReason":null}
data: {"id":"01J3..","delta":" world","finishReason":null}
data: {"id":"01J3..","delta":"","finishReason":"stop"}
event: done
data: [DONE]

# On error mid-stream:
event: error
data: {"code":"PROVIDER_ERROR","message":"upstream disconnected","requestId":"01J3..","retryable":true}
```

### Error Response
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "requestId": "01J3XBK...",
    "retryable": true,
    "retryAfter": 14
  }
}
```

---

## 5. Health Check **[NEW]**

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3920,
  "checks": {
    "redis": "ok",
    "postgres": "ok"
  }
}
```

Returns `503` if Redis or Postgres is unreachable. Used by Railway health probe.

---

## 6. CORS **[NEW]**

```ts
fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Optimise', 'X-No-Cache'],
  exposedHeaders: ['X-Request-Id', 'X-Cache', 'X-Provider', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
})
```

`ALLOWED_ORIGINS` env var. Default `*` for MVP, tighten per deployment.

---

## 7. Failure Handling

```
Primary (timeout 5s)
→ check fallback_chain[0] capability match → attempt (timeout 3s)
→ check fallback_chain[1] capability match → attempt (timeout 3s)
→ all failed → GatewayError { code: 'ALL_FALLBACKS_FAILED', retryable: false }
```

Each fallback attempt is gated through circuit breaker independently.

---

## 8. Monetisation Protection

- Prepaid credits required (balance checked before every request)
- Atomic Redis decrement prevents race conditions on concurrent requests
- Per-key spend cap (optional, stored in DB)
- Hard `402` cutoff — no soft limits for MVP
- Credit top-up via external payment flow (out of scope for MVP — credit added directly to DB)

---

## 9. MVP Scope

**In:**
- Streaming (SSE passthrough)
- Routing (pure function)
- Provider adapters (Gemini, OpenAI, Anthropic, Mistral, Groq, Together)
- Cache (shared, Redis)
- Auth (HMAC-SHA256 API keys)
- Rate limiting (tier-based, Redis)
- Credit checking (atomic, Redis)
- Circuit breaker (3-state, Redis)
- Async logging (queue + worker)
- Health check
- CORS
- Structured logging

**Out (v4+):**
- Semantic cache
- Admin UI
- ML-based routing
- Prometheus endpoint
- Webhook notifications on circuit open

---

## END — SRS v3
