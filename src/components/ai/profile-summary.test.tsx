import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileSummary, ProfileSummarySkeleton } from "./profile-summary";
import { NoAiProviderConfiguredError } from "@/lib/ai/provider";
import { ProfileSummaryError } from "@/lib/ai/summary";
import type { GithubRepo, GithubUser, ReposPage } from "@/lib/github/types";

const getUserMock = vi.hoisted(() => vi.fn());
const getUserReposMock = vi.hoisted(() => vi.fn());
const generateProfileSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/github", () => ({
  getUser: getUserMock,
  getUserRepos: getUserReposMock,
}));

vi.mock("@/lib/ai/summary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/summary")>();
  return {
    ...actual,
    generateProfileSummary: generateProfileSummaryMock,
  };
});

const user: GithubUser = {
  id: 1,
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/1",
  htmlUrl: "https://github.com/octocat",
  bio: "Creator of the Octocat.",
  company: "GitHub",
  location: "San Francisco",
  blog: "https://github.blog",
  followers: 8000,
  following: 9,
  publicRepos: 8,
  publicGists: 1,
  createdAt: "2011-01-25T18:44:36Z",
  type: "User",
};

const repo: GithubRepo = {
  id: 10,
  name: "hello-world",
  fullName: "octocat/hello-world",
  description: "My first repo",
  htmlUrl: "https://github.com/octocat/hello-world",
  homepage: null,
  fork: false,
  language: "TypeScript",
  stargazersCount: 42,
  forksCount: 7,
  watchersCount: 42,
  openIssuesCount: 3,
  defaultBranch: "main",
  topics: ["demo"],
  license: "MIT",
  pushedAt: "2024-01-02T10:00:00Z",
  updatedAt: "2024-01-01T10:00:00Z",
  ownerLogin: "octocat",
  ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
};

const reposPage: ReposPage = {
  repos: [repo],
  page: 1,
  hasNextPage: false,
};

describe("ProfileSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue(user);
    getUserReposMock.mockResolvedValue(reposPage);
  });

  it("renders the generated summary as markdown", async () => {
    generateProfileSummaryMock.mockResolvedValue("## Overview\nA balanced summary.");
    render(await ProfileSummary({ username: "octocat" }));

    expect(screen.getByRole("heading", { name: "AI summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("A balanced summary.")).toBeInTheDocument();
  });

  it("feeds the top starred repos to the summary service", async () => {
    generateProfileSummaryMock.mockResolvedValue("summary");
    await ProfileSummary({ username: "octocat" });

    expect(getUserReposMock).toHaveBeenCalledWith("octocat", {
      perPage: 10,
      sort: "stars",
    });
    const context = generateProfileSummaryMock.mock.calls[0][0];
    expect(context.topRepos).toHaveLength(1);
    expect(context.topRepos[0].name).toBe("hello-world");
    expect(context.user.login).toBe("octocat");
  });

  it("shows a hint when no AI provider is configured", async () => {
    generateProfileSummaryMock.mockRejectedValue(new NoAiProviderConfiguredError());

    render(await ProfileSummary({ username: "octocat" }));

    expect(screen.getByText(/AI summaries are unavailable/)).toBeInTheDocument();
  });

  it("shows a friendly message when generation fails", async () => {
    generateProfileSummaryMock.mockRejectedValue(new ProfileSummaryError("boom"));

    render(await ProfileSummary({ username: "octocat" }));

    expect(screen.getByText(/Could not generate a summary/)).toBeInTheDocument();
  });

  it("renders the skeleton with an accessible label", () => {
    render(<ProfileSummarySkeleton />);
    expect(screen.getByLabelText("AI summary")).toBeInTheDocument();
  });
});
