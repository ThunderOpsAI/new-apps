# LLM Gateway BuildSpec v2

> Patches all BuildSpec gaps from gap analysis. Changes from v1 are marked **[NEW]** or **[FIXED]**.

---

## 1. Environment Bootstrap **[NEW]**

```bash
# Requirements
node: 20.x LTS
packageManager: pnpm@9
typescript: 5.x (strict mode)

# Initialise
mkdir llm-gateway && cd llm-gateway
pnpm init
pnpm add fastify @fastify/cors @fastify/helmet fastify-plugin
pnpm add ioredis postgres ulid tiktoken
pnpm add -D typescript tsx @types/node vitest
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## 2. Folder Structure **[FIXED]**

```plaintext
/src
  /types
    index.ts              ← ALL shared interfaces (NormalisedRequest, GatewayError, etc.) [NEW]

  /api
    chat.ts               ← POST /v1/chat/completions
    health.ts             ← GET /health [NEW]

  /middleware             ← [NEW]
    auth.ts               ← Fastify preHandler: validate + HMAC key check
    rateLimit.ts          ← Fastify preHandler: Redis sliding window
    creditCheck.ts        ← Fastify preHandler: atomic credit deduction [NEW]
    requestId.ts          ← Fastify preHandler: generate + attach ULID [NEW]

  /adapters
    base.ts               ← ProviderAdapter interface re-export
    gemini.ts
    openai.ts
    anthropic.ts
    mistral.ts
    groq.ts
    together.ts

  /router
    router.ts             ← pure function: routeRequest(ctx): RoutingDecision
    rules.ts              ← routing rules config
    capability.ts         ← capability matching helpers [NEW]

  /optimiser
    optimiser.ts          ← prompt optimisation with 500ms timeout

  /cache
    redis.ts              ← get/set with TTL, cache key builder

  /circuit-breaker        ← [NEW]
    breaker.ts            ← 3-state machine (closed/open/half-open)
    store.ts              ← Redis-backed state storage

  /auth
    apiKey.ts             ← HMAC-SHA256 validation, revocation check

  /rate-limit
    redis.ts              ← sliding window per api_key_id

  /credits                ← [NEW]
    credits.ts            ← atomic Redis decrement + reconcile + DB write

  /logging
    queue.ts              ← RPUSH to Redis logging:queue

  /workers               ← [NEW]
    logWriter.ts          ← BLPOP worker → batch insert to Postgres
    dlqWriter.ts          ← file-based DLQ on Postgres failure [NEW]

  /db
    client.ts             ← Postgres connection pool

  /utils
    ulid.ts               ← ULID generation wrapper
    hash.ts               ← HMAC-SHA256 helper
    tokens.ts             ← tiktoken + heuristic fallback

/prisma                   ← [NEW]
  schema.prisma           ← ORM schema (mirrors SQL in SRS §3.7)
  seed.ts                 ← provider_pricing seed data

/migrations               ← [NEW]
  001_initial.sql

server.ts                 ← Fastify app entry point
```

---

## 3. Core Files

### `/src/types/index.ts` **[NEW]**

Single source of truth for all interfaces. Exported and imported by every module.

```ts
export type Capability = 'streaming' | 'tool_use' | 'vision' | 'json_mode' | 'function_calling'

export interface ModelConfig {
  id: string
  maxContextTokens: number
  inputCostPer1kCents: number
  outputCostPer1kCents: number
  capabilities: Capability[]
}

export interface NormalisedRequest {
  requestId: string
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stream: boolean
  tools?: unknown[]
  capabilities: Capability[]
}

export interface NormalisedResponse {
  id: string
  choices: Choice[]
  usage: TokenUsage
  provider: string
  cached: boolean
  latencyMs: number
}

export interface GatewayError {
  code: ErrorCode
  message: string
  requestId: string
  provider?: string
  retryable: boolean
  retryAfter?: number
}

export type ErrorCode =
  | 'PROVIDER_ERROR'
  | 'RATE_LIMITED'
  | 'NO_CREDITS'
  | 'ALL_FALLBACKS_FAILED'
  | 'TIMEOUT'
  | 'INVALID_REQUEST'
  | 'KEY_REVOKED'
  | 'UNAUTHORISED'
  | 'CIRCUIT_OPEN'

export interface RoutingDecision {
  provider: string
  model: string
  fallbackChain: FallbackEntry[]
  estimatedCostCents: number
  reasoning: string
}

export interface FallbackEntry {
  provider: string
  model: string
  capabilityMatch: boolean
}

export interface Chunk {
  id: string
  delta: string
  finishReason: string | null
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export interface Choice {
  message: Message
  finishReason: string
}
```

---

### `/src/api/chat.ts`

- Route: `POST /v1/chat/completions`
- Attaches middleware chain via Fastify preHandlers
- Calls pipeline and returns response
- Sets response headers: `X-Request-Id`, `X-Cache`, `X-Provider`

---

### `/src/api/health.ts` **[NEW]**

- Route: `GET /health`
- Pings Redis + Postgres
- Returns `{ status, version, uptime, checks }`
- Returns `503` on any check failure

---

### `/src/middleware/requestId.ts` **[NEW]**

```ts
// Fastify preHandler — runs FIRST in all routes
fastify.addHook('onRequest', (req, _reply, done) => {
  req.requestId = ulid()
  done()
})
```

---

### `/src/middleware/auth.ts`

```ts
// validate key exists, is not revoked (is_active=true), return user+tier
async function validateApiKey(rawKey: string): Promise<ApiKeyRecord>
// HMAC-SHA256(env.HMAC_SECRET, rawKey) → lookup in DB
```

---

### `/src/middleware/creditCheck.ts` **[NEW]**

```ts
// Atomic Redis decrement
// DECRBY credits:{user_id} {estimated_cost_cents}
// If result < 0: INCRBY (reverse), return 402 GatewayError
// Reserve is reconciled post-response in async log step
```

---

### `/src/router/router.ts`

Pure function — no imports from Redis, DB, or any I/O.

```ts
export function routeRequest(ctx: RoutingContext): RoutingDecision {
  // 1. Filter providers by capability match
  // 2. Apply tier/latency/cost scoring
  // 3. Build fallback chain (capability-matched entries only)
  // 4. Return decision with reasoning string
}
```

---

### `/src/circuit-breaker/breaker.ts` **[NEW]**

```ts
export async function checkCircuit(provider: string): Promise<'open' | 'closed' | 'half-open'>
export async function recordSuccess(provider: string): Promise<void>
export async function recordFailure(provider: string): Promise<void>

// State transitions:
// closed: allow all
// open: reject with CIRCUIT_OPEN error
// half-open: allow exactly 1 probe, reject rest with CIRCUIT_OPEN + retryable:true
```

---

### `/src/credits/credits.ts` **[NEW]**

```ts
export async function reserveCredits(userId: string, estimatedCents: number): Promise<void>
// Throws GatewayError { code: 'NO_CREDITS' } if insufficient

export async function reconcileCredits(userId: string, estimatedCents: number, actualCents: number): Promise<void>
// INCRBY/DECRBY the delta, write credit_events record to queue
```

---

### `/src/logging/queue.ts`

```ts
export async function enqueueLog(entry: LogEntry): Promise<void> {
  try {
    await redis.rpush('logging:queue', JSON.stringify(entry))
  } catch {
    // Redis is down: emit warning to stdout, do NOT throw
    console.warn({ event: 'log_queue_failed', requestId: entry.requestId })
  }
}
```

---

### `/src/workers/logWriter.ts` **[NEW]**

Separate long-running process. Started independently in Railway.

```ts
// Infinite loop:
// BLPOP logging:queue 5 → parse → batch INSERT to request_logs + credit_events
// On Postgres failure after 3 retries → dlqWriter.write(entry)
```

---

### `/prisma/schema.prisma` **[NEW]**

Mirrors all tables from SRS §3.7 exactly:
- `users`, `api_keys`, `credits`, `credit_events`, `request_logs`, `provider_pricing`

---

### `/prisma/seed.ts` **[NEW]**

Seeds `provider_pricing` with current rates for:
- `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/gpt-3.5-turbo`
- `anthropic/claude-3-5-sonnet`, `anthropic/claude-3-haiku`
- `google/gemini-1.5-pro`, `google/gemini-1.5-flash`
- `mistral/mistral-large`, `groq/llama-3-70b`, `together/mixtral-8x7b`

---

## 4. Env Variables **[FIXED]**

```plaintext
# App
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Security [NEW]
HMAC_SECRET=<random-64-char-hex>       ← used for API key hashing

# CORS [NEW]
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Version [NEW]
APP_VERSION=1.0.0

# Provider Keys
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
```

---

## 5. Request Pipeline **[FIXED — 12 steps]**

```
1.  Generate Request ID (ULID)              ← middleware/requestId.ts
2.  CORS preflight check                    ← @fastify/cors
3.  Auth: validate API key (HMAC + is_active check) ← middleware/auth.ts
4.  Rate limit: sliding window check        ← middleware/rateLimit.ts
5.  Parse + validate request body           ← api/chat.ts
6.  Token estimate — Phase 1 (pre-routing)  ← utils/tokens.ts
7.  Credit check + reserve                  ← middleware/creditCheck.ts
8.  Routing decision (pure fn)              ← router/router.ts
9.  Cache lookup (skip if stream/tools)     ← cache/redis.ts
10. Prompt optimisation (opt-in, 500ms timeout)
11. Provider call:
    a. Check circuit breaker
    b. Call adapter (stream or non-stream)
    c. On failure → capability-matched fallback
    d. Record circuit breaker result
12. Token estimate — Phase 2 (from provider usage response)
13. Set response headers (X-Request-Id, X-Cache, X-Provider)
14. Return response to client
15. Async: enqueue log entry + credit reconcile (non-blocking)
```

---

## 6. Deployment

**Railway Services:**
- `gateway` — Fastify API (`server.ts`)
- `log-worker` — `logWriter.ts` (`node dist/workers/logWriter.js`)
- `redis` — Railway Redis addon
- `postgres` — Railway Postgres addon

**GitHub Actions:**
```yaml
on: [push to main]
jobs:
  deploy:
    - pnpm install
    - pnpm typecheck
    - pnpm test
    - railway deploy
```

**Migration on deploy:**
```bash
npx prisma migrate deploy
npx prisma db seed   # only runs once via seed guard
```

---

## 7. Testing

| Type | Tool | Coverage target |
|---|---|---|
| Unit | Vitest | router.ts, capability.ts, hash.ts, tokens.ts |
| Integration | Vitest + testcontainers | Each adapter (mock provider server) |
| Load | k6 | 50–100 req/sec sustained, p95 < 500ms |
| Circuit breaker | Vitest | State machine transitions |
| Credit | Vitest | Race condition with concurrent requests |

**Key unit tests:**
- `routeRequest` selects correct provider for each tier
- `routeRequest` excludes providers missing required capabilities
- `checkCircuit` transitions correctly through all 3 states
- `reserveCredits` rejects when balance insufficient
- `validateApiKey` rejects revoked keys

---

## END — BuildSpec v2
