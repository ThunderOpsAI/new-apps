const hits = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;

export function enforceRateLimit(ipHash: string) {
  const now = Date.now();
  const recent = (hits.get(ipHash) ?? []).filter((value) => now - value < WINDOW_MS);
  if (recent.length >= LIMIT) {
    throw new Error("Rate limit exceeded. Try again in an hour.");
  }
  recent.push(now);
  hits.set(ipHash, recent);
}
