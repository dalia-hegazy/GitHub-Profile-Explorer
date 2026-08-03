import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GithubError } from "./errors";
import { rawRepoSchema, rawUserSchema } from "./schemas";
import { getUser, getUserRepos } from "./users";

const mockEnv = vi.hoisted(() => ({ GITHUB_TOKEN: undefined as string | undefined }));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

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
  public_repos: 5,
  public_gists: 1,
  created_at: "2011-01-25T18:44:36Z",
  type: "User",
});

const rawRepo = rawRepoSchema.parse({
  id: 10,
  name: "hello-world",
  full_name: "octocat/hello-world",
  description: "My first repo",
  html_url: "https://github.com/octocat/hello-world",
  homepage: null,
  fork: false,
  language: "TypeScript",
  stargazers_count: 42,
  forks_count: 7,
  watchers_count: 42,
  open_issues_count: 3,
  default_branch: "main",
  topics: ["demo"],
  license: { spdx_id: "MIT" },
  pushed_at: "2024-01-02T10:00:00Z",
  updated_at: "2024-01-01T10:00:00Z",
  owner: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
});

function jsonResponse(body: unknown, init: Partial<ResponseInit> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
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
  mockEnv.GITHUB_TOKEN = undefined;
});

describe("getUser", () => {
  it("fetches a user, maps it, and passes the GitHub API headers", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(rawUser));

    const user = await getUser("octocat");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/users/octocat");
    expect(init.headers.accept).toBe("application/vnd.github+json");
    expect(init.headers["x-github-api-version"]).toBe("2022-11-28");
    expect(user.login).toBe("octocat");
    expect(user.name).toBe("The Octocat");
  });

  it("throws a not_found GithubError on a 404", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, { status: 404 }));

    const result = await getUser("ghost").catch((error) => error);
    expect(result).toBeInstanceOf(GithubError);
    expect(result).toMatchObject({ code: "not_found", status: 404 });
  });

  it("throws a validation error for invalid usernames without hitting the API", async () => {
    await expect(getUser("")).rejects.toMatchObject({ code: "validation" });
    await expect(getUser("has space")).rejects.toMatchObject({ code: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("includes the Authorization header when a token is configured", async () => {
    mockEnv.GITHUB_TOKEN = "test-token";
    fetchMock.mockResolvedValueOnce(jsonResponse(rawUser));

    await getUser("octocat");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe("Bearer test-token");
  });

  it("reports rate-limit info on a 403", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { message: "API rate limit exceeded" },
        {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1700000000",
          },
        },
      ),
    );

    try {
      await getUser("octocat");
      expect.unreachable("expected a GithubError");
    } catch (error) {
      expect(error).toMatchObject({
        code: "rate_limited",
        status: 403,
        rateLimit: { remaining: 0, reset: 1700000000 },
      });
    }
  });
});

describe("getUserRepos", () => {
  it("fetches the first page of repos and maps them", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([rawRepo]));

    const page = await getUserRepos("octocat");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("https://api.github.com/users/octocat/repos?");
    expect(page.repos).toHaveLength(1);
    expect(page.page).toBe(1);
    expect(page.hasNextPage).toBe(false);
    expect(page.repos[0].fullName).toBe("octocat/hello-world");
  });

  it("reports hasNextPage from the Link header", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([rawRepo], {
        headers: { link: '<https://api.github.com/users/octocat/repos?page=2>; rel="next"' },
      }),
    );

    const page = await getUserRepos("octocat");
    expect(page.hasNextPage).toBe(true);
  });

  it("honors pagination options", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    await getUserRepos("octocat", { page: 2, perPage: 50, sort: "stars" });

    const [url] = fetchMock.mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get("page")).toBe("2");
    expect(params.get("per_page")).toBe("50");
    expect(params.get("sort")).toBe("stars");
    expect(params.get("direction")).toBe("desc");
  });
});
