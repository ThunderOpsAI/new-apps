# LLM Gateway — Agent Handover v2

You are a senior backend engineer building the LLM Gateway MVP.

Read the SRS v3 and BuildSpec v2 before starting. This document tells you *how* to work, not what to build — the specs tell you what to build.

---

## RULES

* DO NOT overengineer
* FOLLOW folder structure exactly as specified in BuildSpec v2
* FAIL SAFE > clever logic
* COMMIT after every phase (git checkpoint)
* USE Fastify (not Express)
* USE pnpm (not npm or yarn)
* USE strict TypeScript
* USE ULID (not UUID v4) for request IDs

---

## ENVIRONMENT SETUP (do this before Phase 1) **[NEW]**

```bash
# 1. Verify tooling
node --version    # must be 20.x
pnpm --version    # must be 9.x

# 2. Clone / init repo
mkdir llm-gateway && cd llm-gateway
git init
pnpm init

# 3. Install deps
pnpm add fastify @fastify/cors @fastify/helmet
pnpm add ioredis postgres ulid tiktoken
pnpm add zod                          # request validation
pnpm add @prisma/client
pnpm add -D typescript tsx vitest @types/node prisma

# 4. Init Prisma
npx prisma init

# 5. Create tsconfig.json (strict mode — see BuildSpec v2 §1)

# 6. Set env vars (copy .env.example → .env, fill in local values)
```

Confirm: `npx tsx src/server.ts` starts without error before proceeding.

---

## GIT STRATEGY **[NEW]**

```
main          ← stable, deployable
  └─ feature/phase-N   ← work branch per phase
```

After each phase:
1. Run tests
2. `git add -A && git commit -m "phase N: <summary>"`
3. Merge to `main` only if phase success criteria are met
4. Do NOT proceed to Phase N+1 if Phase N tests are failing

**Rollback:** If a phase breaks main, `git revert` the merge commit. Do not carry broken state forward.

---

## PHASES

---

### Phase 0 — Shared Types + DB Schema

**Before writing any business logic, establish the contract.**

Files to create:
- `/src/types/index.ts` — all shared interfaces from BuildSpec v2 §3
- `/prisma/schema.prisma` — full schema from SRS v3 §3.7
- `/prisma/seed.ts` — provider_pricing seed data (all 10 providers)
- `/migrations/001_initial.sql` — raw SQL mirror of schema

Commands:
```bash
npx prisma migrate dev --name initial
npx prisma db seed
```

**Success criteria:**
- `prisma studio` shows all tables with correct columns
- Seed data visible in `provider_pricing`
- TypeScript compiles with `pnpm typecheck` — zero errors

**Commit:** `git commit -m "phase 0: types, schema, seed"`

---

### Phase 1 — Core API + Streaming Skeleton

**Build the full request pipeline with mock responses — including a hardcoded SSE stream.** **[FIXED]**

Files to create:
- `server.ts` — Fastify app, register plugins, mount routes
- `/src/api/health.ts` — `GET /health`
- `/src/api/chat.ts` — `POST /v1/chat/completions`
- `/src/middleware/requestId.ts` — ULID preHandler
- `/src/utils/ulid.ts`

`POST /v1/chat/completions` at this stage:
- Validates request body (use Zod schema matching SRS §4)
- Returns a hardcoded **non-streaming** mock response (correct shape)
- Returns a hardcoded **streaming** SSE mock if `stream: true` (4 events then `[DONE]`)
- Sets `X-Request-Id` header on every response

Hardcoded SSE mock:
```
data: {"id":"mock","delta":"Hello","finishReason":null}
data: {"id":"mock","delta":" world","finishReason":null}
data: {"id":"mock","delta":"!","finishReason":"stop"}
event: done
data: [DONE]
```

**Why streaming skeleton now:** Proves SSE plumbing works before any real provider is wired. Much harder to retrofit.

**Success criteria:**
- `curl -X POST localhost:3000/v1/chat/completions -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}],"stream":false}'` returns valid JSON
- `curl -N -X POST ... '{"stream":true}'` prints SSE events to terminal
- `curl localhost:3000/health` returns `{"status":"ok", ...}`
- Schema validation rejects malformed requests with `400`

**Commit:** `git commit -m "phase 1: core api, health, streaming skeleton"`

---

### Phase 2 — Auth + Rate Limit

Files to create:
- `/src/auth/apiKey.ts` — HMAC-SHA256 lookup, revocation check
- `/src/middleware/auth.ts` — Fastify preHandler
- `/src/rate-limit/redis.ts` — sliding window per api_key_id
- `/src/middleware/rateLimit.ts` — Fastify preHandler

Auth flow:
1. Extract `Authorization: Bearer <raw_key>` header
2. Compute `HMAC-SHA256(env.HMAC_SECRET, rawKey)`
3. Look up hash in `api_keys` table
4. Reject if not found (`401 UNAUTHORISED`)
5. Reject if `is_active = false` (`401 KEY_REVOKED`)
6. Attach `{ userId, tier, apiKeyId }` to request context

Rate limit:
- Redis sliding window: `ratelimit:{apiKeyId}` with 60s window
- Tier → RPM from SRS v3 §3.10
- Return `429` with `Retry-After` header if exceeded

**Success criteria:**
- Valid key: request proceeds
- Invalid key: `401`
- Revoked key: `401 KEY_REVOKED`
- Exceeding RPM: `429` with correct headers
- Unit tests: all auth + rate limit branches covered

**Commit:** `git commit -m "phase 2: auth, rate limit"`

---

### Phase 3 — Router

Files to create:
- `/src/router/router.ts` — pure function `routeRequest(ctx): RoutingDecision`
- `/src/router/rules.ts` — provider priority config
- `/src/router/capability.ts` — `hasCapabilities(provider, required[]): boolean`

Rules:
- Free tier → lowest cost model
- Pro tier → balance cost + quality
- Enterprise → lowest latency
- `tool_use` in capabilities → only providers that support it
- `providerOverride` bypasses all scoring but still checks circuit breaker

**Success criteria (unit tests — Vitest):**
- Free tier chat → routes to cheapest capable model
- `tool_use` request → never routes to provider missing `tool_use` capability
- `providerOverride: 'openai'` → returns OpenAI with correct model
- Fallback chain contains only capability-matched providers
- No I/O performed (pure function)

**Commit:** `git commit -m "phase 3: routing engine"`

---

### Phase 4 — Provider Adapters

Implement in order: **OpenAI → Gemini → Anthropic → Mistral → Groq → Together**

Each adapter file:
- Implements `ProviderAdapter` interface from `/src/types/index.ts`
- Handles `call()` and `stream()` separately
- Maps provider errors to `GatewayError` via `parseError()`
- Includes capability declarations in `models[]`

Start with OpenAI — it is the reference implementation. All others follow the same pattern.

**Wiring:** Replace mock response in `chat.ts` with real adapter call using routing decision from Phase 3.

**Success criteria:**
- `POST /v1/chat/completions` with real OpenAI key returns real response
- Streaming with `stream: true` returns real SSE from OpenAI
- All 6 adapters compile without TypeScript errors
- Integration test: each adapter returns `NormalisedResponse` with correct shape

**Commit:** `git commit -m "phase 4: provider adapters"`

---

### Phase 5 — Cache

Files:
- `/src/cache/redis.ts` — `get(key)`, `set(key, value, ttl)`, `buildKey(req)`

Key: `SHA-256(provider + model + temperature + maxTokens + JSON.stringify(messages))`

Skip cache when:
- `req.stream === true`
- `req.tools` is non-empty
- `X-No-Cache: true` header

On cache hit:
- Return immediately, set `X-Cache: HIT`, skip provider call
- Still enqueue a log entry (with `cache_hit: true`)

**Success criteria:**
- Same request twice → second returns `X-Cache: HIT` and is faster
- Streaming request → always `X-Cache: MISS`
- Tool use request → always `X-Cache: MISS`

**Commit:** `git commit -m "phase 5: cache"`

---

### Phase 6 — Circuit Breaker **[MOVED UP — was Phase 8]**

Circuit breaker must be in place before the system handles real traffic.

Files:
- `/src/circuit-breaker/breaker.ts` — 3-state machine
- `/src/circuit-breaker/store.ts` — Redis state storage

State machine (from SRS v3 §3.12):
- `CLOSED` → allow all
- `OPEN` → reject with `CIRCUIT_OPEN, retryable: true`
- `HALF-OPEN` → allow 1 probe, reject rest

Wire into provider call flow: check circuit before every attempt (primary + each fallback).

**Success criteria (unit tests):**
- 5 failures in 30s → transitions to OPEN
- After 60s → transitions to HALF-OPEN
- Probe success → transitions to CLOSED
- Probe failure → transitions back to OPEN
- Redis outage → fails open (does NOT block requests)

**Commit:** `git commit -m "phase 6: circuit breaker"`

---

### Phase 7 — Credits

Files:
- `/src/credits/credits.ts`
- `/src/middleware/creditCheck.ts`

Flow (from SRS v3 §3.11):
1. Phase 1 token estimate → estimate cost
2. `reserveCredits(userId, estimatedCents)` — atomic Redis DECRBY
3. On `< 0`: INCRBY to reverse, return `402 NO_CREDITS`
4. After response: `reconcileCredits(userId, estimated, actual)` — adjust balance
5. Write `credit_events` record to log queue

**Success criteria:**
- Balance 100 cents, request costs 50 → succeeds, balance 50
- Balance 10 cents, request costs 50 → `402`
- Two concurrent 60-cent requests against 80-cent balance → exactly one succeeds
- Reconcile adjusts balance correctly when actual ≠ estimate

**Commit:** `git commit -m "phase 7: credits"`

---

### Phase 8 — Async Logging

Files:
- `/src/logging/queue.ts` — `enqueueLog(entry)`
- `/src/workers/logWriter.ts` — BLPOP worker
- `/src/workers/dlqWriter.ts` — file DLQ fallback

Worker runs as a separate Railway service. Do not co-locate with the API process.

Log entry shape:
```ts
{
  requestId, apiKeyId, provider, model,
  tokensIn, tokensOut, costCents,
  latencyMs, cacheHit, finishReason,
  createdAt
}
```

**Success criteria:**
- Requests log to `request_logs` within 2s of completion
- Redis down → request still succeeds, warning logged to stdout
- Postgres down → entry written to DLQ file
- No blocking: API response is returned before log write

**Commit:** `git commit -m "phase 8: async logging"`

---

### Phase 9 — Prompt Optimisation

Files:
- `/src/optimiser/optimiser.ts`

Opt-in via `X-Optimise: true`. 500ms hard timeout. Skip on timeout, not an error.

Never apply to streaming requests.

**Commit:** `git commit -m "phase 9: prompt optimiser"`

---

## OUTPUT FORMAT (after each phase)

Report:
1. Files created (paths)
2. Files modified (paths + what changed)
3. Key implementation decision (1 sentence)
4. Test results (`pnpm test` output summary)
5. Blockers or open questions

---

## FULL SUCCESS CRITERIA

Before calling the MVP complete, verify ALL of the following:

- [ ] OpenAI-compatible API responds correctly (non-streaming)
- [ ] Streaming works (`stream: true` delivers SSE)
- [ ] Routing selects correct provider based on tier + capabilities
- [ ] Fallback engages on provider failure
- [ ] Fallback skips providers missing required capabilities
- [ ] Circuit breaker opens after 5 failures, recovers after probe
- [ ] API key validation works (valid, invalid, revoked)
- [ ] Rate limiting blocks at RPM threshold with correct headers
- [ ] Credits block requests when balance is 0
- [ ] Cache returns HIT on second identical request
- [ ] Streaming is never cached
- [ ] Logs appear in `request_logs` within 2s
- [ ] `GET /health` returns `200` with all checks passing
- [ ] TypeScript: `pnpm typecheck` zero errors
- [ ] Load test: 50 req/sec sustained, p95 latency < 500ms

---

## DO NOT

* Add a UI
* Add unnecessary abstractions or intermediate interfaces
* Skip error handling at any step
* Use Express
* Use `any` in TypeScript
* Use UUID — use ULID
* Block the request-response cycle with synchronous DB writes

---

## START WITH PHASE 0
