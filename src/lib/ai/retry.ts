import "server-only";

/**
 * Executes an async AI call across a list of candidate models (e.g. multiple
 * Gemini keys). On a rate-limit (HTTP 429) error it moves to the next model;
 * on any other error it rethrows immediately. Non-429 errors, including a
 * 429 raised by the final model, are the last recorded error.
 *
 * @param fn Takes a model index and returns the operation result.
 * @param models Number of candidate models available (drives fallback count).
 * @param baseMs Initial backoff delay; doubles after each failed attempt.
 */
export async function withModelFallback<T>(
  fn: (modelIndex: number) => Promise<T>,
  models: unknown[],
  baseMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < Math.max(1, models.length); index++) {
    try {
      return await fn(index);
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error)) {
        throw error;
      }
      // Keep trying the next model if one remains.
      if (index + 1 >= Math.max(1, models.length)) {
        break;
      }
      await sleep(baseMs);
    }
  }
  throw lastError;
}

export function isRateLimitError(error: unknown): boolean {
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