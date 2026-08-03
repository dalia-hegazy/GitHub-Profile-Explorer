import { describe, expect, it } from "vitest";

import { mapBranch, mapCommit, mapRepo, mapUser } from "./mappers";
import type { RawBranch, RawCommit, RawRepo, RawUser } from "./schemas";

const rawUser: RawUser = {
  id: 1,
  login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  bio: "Hello world",
  company: "GitHub",
  location: "San Francisco",
  blog: "https://octocat.dev",
  followers: 100,
  following: 20,
  public_repos: 5,
  public_gists: 1,
  created_at: "2011-01-25T18:44:36Z",
  type: "User",
};

const rawRepo: RawRepo = {
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
  topics: ["demo", "octocat"],
  license: { spdx_id: "MIT" },
  pushed_at: "2024-01-02T10:00:00Z",
  updated_at: "2024-01-01T10:00:00Z",
  owner: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
};

describe("mapUser", () => {
  it("maps snake_case API fields to camelCase domain fields", () => {
    const user = mapUser(rawUser);
    expect(user).toEqual({
      id: 1,
      login: "octocat",
      name: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      htmlUrl: "https://github.com/octocat",
      bio: "Hello world",
      company: "GitHub",
      location: "San Francisco",
      blog: "https://octocat.dev",
      followers: 100,
      following: 20,
      publicRepos: 5,
      publicGists: 1,
      createdAt: "2011-01-25T18:44:36Z",
      type: "User",
    });
  });
});

describe("mapRepo", () => {
  it("maps API fields, defaults topics, and extracts the license id", () => {
    const repo = mapRepo(rawRepo);
    expect(repo.fullName).toBe("octocat/hello-world");
    expect(repo.topics).toEqual(["demo", "octocat"]);
    expect(repo.license).toBe("MIT");
    expect(repo.ownerLogin).toBe("octocat");
  });

  it("handles a repo without a license or topics", () => {
    const repo = mapRepo({ ...rawRepo, license: null, topics: [] });
    expect(repo.license).toBeNull();
    expect(repo.topics).toEqual([]);
  });
});

const rawCommit: RawCommit = {
  sha: "abc123",
  html_url: "https://github.com/octocat/hello-world/commit/abc123",
  commit: {
    message: "Fix the bug",
    author: { name: "The Octocat", date: "2024-06-01T10:00:00Z" },
  },
  author: { login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/1" },
};

describe("mapCommit", () => {
  it("maps commit fields and falls back to the committer info", () => {
    const commit = mapCommit(rawCommit);
    expect(commit.sha).toBe("abc123");
    expect(commit.message).toBe("Fix the bug");
    expect(commit.authorLogin).toBe("octocat");
    expect(commit.authorAvatarUrl).toBe("https://avatars.githubusercontent.com/u/1");
    expect(commit.committedAt).toBe("2024-06-01T10:00:00Z");
    expect(commit.htmlUrl).toBe(
      "https://github.com/octocat/hello-world/commit/abc123",
    );
  });

  it("falls back to the commit author name when the author object is missing", () => {
    const commit = mapCommit({ ...rawCommit, author: null });
    expect(commit.authorLogin).toBe("The Octocat");
    expect(commit.authorAvatarUrl).toBeNull();
  });
});

describe("mapBranch", () => {
  it("maps branch fields", () => {
    const branch = mapBranch({ name: "main", commit: { sha: "abc" } } satisfies RawBranch);
    expect(branch).toEqual({ name: "main", commitSha: "abc" });
  });
});
