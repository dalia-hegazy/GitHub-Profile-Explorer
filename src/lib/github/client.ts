import "server-only";

import { env } from "@/lib/env";

import { GithubError, type RateLimitInfo } from "./errors";

const GITHUB_API_URL = "https://api.github.com";
const DEFAULT_REVALIDATE_SECONDS = 300;

interface GithubFetchOptions {
  method?: "GET" | "HEAD";
  revalidate?: number;
}

/**
 * Low-level GitHub REST API client. All GitHub traffic flows through here so
 * authentication, caching, and error/rate-limit handling live in one place.
 */
export async function githubFetch(path: string, options: GithubFetchOptions = {}): Promise<Response> {
  const url = `${GITHUB_API_URL}${path}`;
  const headers: HeadersInit = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "github-profile-explorer/0.1.0",
  };
  if (env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
    });
  } catch (cause) {
    throw new GithubError("Unable to reach the GitHub API.", { code: "network", cause });
  }

  await throwIfNotOk(response);
  return response;
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const status = response.status;

  if (status === 403 || status === 429) {
    throw new GithubError("GitHub API rate limit exceeded. Please try again later.", {
      status,
      code: "rate_limited",
      retryAfterSeconds: parseRetryAfter(response) ?? undefined,
      rateLimit: parseRateLimit(response),
    });
  }
  if (status === 404) {
    throw new GithubError("GitHub user or repository not found.", {
      status,
      code: "not_found",
    });
  }
  if (status === 401) {
    throw new GithubError("GitHub authentication failed. Check the GITHUB_TOKEN.", {
      status,
      code: "unauthorized",
    });
  }

  const body = await response.text().catch(() => "");
  throw new GithubError(
    `GitHub API request failed with status ${status}${body ? `: ${body.slice(0, 200)}` : ""}.`,
    { status },
  );
}

function parseRateLimit(response: Response): RateLimitInfo | undefined {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  if (remaining === null || reset === null) {
    return undefined;
  }
  const remainingNum = Number(remaining);
  const resetNum = Number(reset);
  if (Number.isNaN(remainingNum) || Number.isNaN(resetNum)) {
    return undefined;
  }
  return { remaining: remainingNum, reset: resetNum };
}

function parseRetryAfter(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter === null) {
    return null;
  }
  const seconds = Number(retryAfter);
  return Number.isNaN(seconds) ? null : seconds;
}

/** Extracts the `page` value from a `Link: ... rel="next"` header, if present. */
export function parseNextPage(response: Response): number | null {
  const link = response.headers.get("link");
  if (!link) {
    return null;
  }
  const next = link.split(",").find((part) => part.includes('rel="next"'));
  if (!next) {
    return null;
  }
  const match = next.match(/[?&]page=(\d+)/);
  if (!match) {
    return null;
  }
  const page = Number(match[1]);
  return Number.isInteger(page) ? page : null;
}
