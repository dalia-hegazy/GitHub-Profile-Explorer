import "server-only";

/**
 * Retries an async AI call when the provider returns a rate-limit (HTTP 429)
 * error. Keeps transient quota/throughput hits from surfacing to users.
 *
 * @param fn      The operation to run.
 * @param retries Number of extra attempts after the first call.
 * @param baseMs  Initial backoff delay; doubles after each attempt.
 */
export async function withRetryOnRateLimit<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRateLimitError(error)) {
        throw error;
      }
      await sleep(baseMs * 2 ** attempt);
    }
  }
  throw lastError;
}

function isRateLimitError(error: unknown): boolean {
  // @ai-sdk errors carry a numeric status (429) and message.
  if (typeof error === "object" && error !== null) {
    const candidate = error as { statusCode?: unknown; status?: unknown };
    if (candidate.statusCode === 429 || candidate.status === 429) return true;
    const message = (error as { message?: string }).message ?? "";
    return message.includes("429") && /rate|quota|limit/i.test(message);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}