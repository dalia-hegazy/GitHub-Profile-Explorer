import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GithubError } from "./errors";
import {
  getBranches,
  getLanguages,
  getReadme,
  getRecentCommits,
  getRepo,
} from "./repos";
import { rawRepoSchema } from "./schemas";

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

const rawCommit = {
  sha: "abc123",
  html_url: "https://github.com/octocat/hello-world/commit/abc123",
  commit: {
    message: "Fix the bug",
    author: { name: "The Octocat", date: "2024-06-01T10:00:00Z" },
  },
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

describe("getRepo", () => {
  it("fetches a single repo and maps it", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(rawRepo));

    const repo = await getRepo("octocat", "hello-world");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/octocat/hello-world");
    expect(repo.fullName).toBe("octocat/hello-world");
  });
});

describe("getReadme", () => {
  it("decodes base64 readme content", async () => {
    const content = Buffer.from("# Hello\n\nWorld").toString("base64");
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ name: "README.md", path: "README.md", content, encoding: "base64" }),
    );

    const readme = await getReadme("octocat", "hello-world");

    expect(readme).toBe("# Hello\n\nWorld");
  });

  it("returns null when the repository has no readme", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404));

    const readme = await getReadme("octocat", "hello-world");

    expect(readme).toBeNull();
  });
});

describe("getLanguages", () => {
  it("returns the languages with byte counts", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ TypeScript: 1000, JavaScript: 500 }));

    const languages = await getLanguages("octocat", "hello-world");

    expect(languages).toEqual({ TypeScript: 1000, JavaScript: 500 });
  });
});

describe("getBranches", () => {
  it("fetches and maps branches", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { name: "main", commit: { sha: "a1" } },
        { name: "dev", commit: { sha: "a2" } },
      ]),
    );

    const branches = await getBranches("octocat", "hello-world");

    expect(branches).toEqual([
      { name: "main", commitSha: "a1" },
      { name: "dev", commitSha: "a2" },
    ]);
  });
});

describe("getRecentCommits", () => {
  it("fetches recent commits and maps them", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([rawCommit]));

    const commits = await getRecentCommits("octocat", "hello-world");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/repos/octocat/hello-world/commits?");
    expect(commits).toHaveLength(1);
    expect(commits[0].message).toBe("Fix the bug");
  });

  it("passes the branch as the sha parameter", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    await getRecentCommits("octocat", "hello-world", { branch: "dev" });

    const [url] = fetchMock.mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get("sha")).toBe("dev");
  });

  it("passes the since parameter for commit frequency", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    await getRecentCommits("octocat", "hello-world", { since: "2024-05-01T00:00:00Z" });

    const [url] = fetchMock.mock.calls[0];
    const params = new URL(url).searchParams;
    expect(params.get("since")).toBe("2024-05-01T00:00:00Z");
  });

  it("throws for invalid repo names", async () => {
    await expect(getRepo("", "")).rejects.toMatchObject({ code: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a not_found error when the repo does not exist", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404));

    await expect(getRepo("octocat", "missing")).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.github.com/repos/octocat/missing");
  });
});

describe("getLanguages error propagation", () => {
  it("propagates non-404 errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 403));

    await expect(getLanguages("octocat", "hello-world")).rejects.toBeInstanceOf(
      GithubError,
    );
  });
});
