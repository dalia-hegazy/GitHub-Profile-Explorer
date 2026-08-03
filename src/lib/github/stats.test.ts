import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserStats } from "./stats";
import { rawRepoSchema, rawUserSchema } from "./schemas";

const rawUser = rawUserSchema.parse({
  id: 1,
  login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  bio: null,
  company: null,
  location: null,
  blog: null,
  followers: 100,
  following: 20,
  public_repos: 2,
  public_gists: 1,
  created_at: "2011-01-25T18:44:36Z",
  type: "User",
});

const rawRepoA = rawRepoSchema.parse({
  id: 10,
  name: "hello-world",
  full_name: "octocat/hello-world",
  description: null,
  html_url: "https://github.com/octocat/hello-world",
  homepage: null,
  fork: false,
  language: "TypeScript",
  stargazers_count: 42,
  forks_count: 7,
  watchers_count: 42,
  open_issues_count: 3,
  default_branch: "main",
  topics: [],
  license: null,
  pushed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
});

const rawRepoB = rawRepoSchema.parse({
  id: 11,
  name: "cli",
  full_name: "octocat/cli",
  description: null,
  html_url: "https://github.com/octocat/cli",
  homepage: null,
  fork: false,
  language: "TypeScript",
  stargazers_count: 8,
  forks_count: 2,
  watchers_count: 8,
  open_issues_count: 1,
  default_branch: "main",
  topics: [],
  license: null,
  pushed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
});

const rawCommit = {
  sha: "abc123",
  html_url: "https://github.com/octocat/hello-world/commit/abc123",
  commit: { message: "Fix", author: { name: "The Octocat", date: new Date().toISOString() } },
  author: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getUserStats", () => {
  it("computes aggregate metrics from the user and their repos", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/users/octocat/repos")) {
        return Promise.resolve(jsonResponse([rawRepoA, rawRepoB]));
      }
      if (url.includes("/users/octocat")) {
        return Promise.resolve(jsonResponse(rawUser));
      }
      if (url.includes("/repos/octocat/")) {
        return Promise.resolve(jsonResponse([rawCommit]));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });

    const stats = await getUserStats("octocat");

    expect(stats.user.login).toBe("octocat");
    expect(stats.reposCount).toBe(2);
    expect(stats.followers).toBe(100);
    expect(stats.totalStars).toBe(50);
    expect(stats.totalForks).toBe(9);
    expect(stats.topLanguage).toBe("TypeScript");
    expect(stats.commitsLast30Days).toBeGreaterThanOrEqual(1);
    expect(stats.accountAgeYears).toBeGreaterThan(0);
  });

  it("handles repos without languages", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/users/octocat/repos")) {
        return Promise.resolve(jsonResponse([{ ...rawRepoA, language: null }]));
      }
      if (url.includes("/repos/")) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse(rawUser));
    });

    const stats = await getUserStats("octocat");
    expect(stats.topLanguage).toBeNull();
  });
});
