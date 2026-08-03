export type GithubErrorCode =
  | "not_found"
  | "rate_limited"
  | "unauthorized"
  | "validation"
  | "network"
  | "unknown";

export interface RateLimitInfo {
  remaining: number;
  reset: number;
}

interface GithubErrorOptions {
  status?: number;
  code?: GithubErrorCode;
  retryAfterSeconds?: number;
  rateLimit?: RateLimitInfo;
  cause?: unknown;
}

export class GithubError extends Error {
  readonly status: number;
  readonly code: GithubErrorCode;
  readonly retryAfterSeconds?: number;
  readonly rateLimit?: RateLimitInfo;

  constructor(message: string, options: GithubErrorOptions = {}) {
    super(message);
    this.name = "GithubError";
    this.status = options.status ?? 0;
    this.code = options.code ?? "unknown";
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.rateLimit = options.rateLimit;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isGithubError(error: unknown): error is GithubError {
  return error instanceof GithubError;
}
