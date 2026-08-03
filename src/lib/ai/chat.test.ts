import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GithubCommit, GithubRepo, RepoLanguages } from "@/lib/github/types";

import { buildRepoContext, buildSystemPrompt, streamRepoChat } from "./chat";
import { NoAiProviderConfiguredError } from "./provider";

const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY: undefined as string | undefined,
}));

const streamTextMock = vi.hoisted(() => vi.fn());

const getRepoMock = vi.hoisted(() => vi.fn());
const getReadmeMock = vi.hoisted(() => vi.fn());
const getLanguagesMock = vi.hoisted(() => vi.fn());
const getRecentCommitsMock = vi.hoisted(() => vi.fn());
const getChatHistoryMock = vi.hoisted(() => vi.fn());
const appendChatMessageMock = vi.hoisted(() => vi.fn());
const isDbConfiguredMock = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@ai-sdk/openai", () => ({
  openai: (model: string) => ({ provider: "openai", model }),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (model: string) => ({ provider: "anthropic", model }),
}));
vi.mock("ai", () => ({ streamText: streamTextMock }));
vi.mock("@/lib/github", () => ({
  getRepo: getRepoMock,
  getReadme: getReadmeMock,
  getLanguages: getLanguagesMock,
  getRecentCommits: getRecentCommitsMock,
}));
vi.mock("@/db/chat", () => ({
  getChatHistory: getChatHistoryMock,
  appendChatMessage: appendChatMessageMock,
}));
vi.mock("@/db/client", () => ({
  isDbConfigured: isDbConfiguredMock,
}));

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

const commits: GithubCommit[] = [
  {
    sha: "abc123def",
    htmlUrl: "https://github.com/octocat/hello-world/commit/abc123def",
    message: "Add feature",
    authorLogin: "octocat",
    authorAvatarUrl: null,
    committedAt: "2024-01-01T10:00:00Z",
  },
];

const languages: RepoLanguages = { TypeScript: 900, JavaScript: 100 };

describe("chat service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.OPENAI_API_KEY = "sk-openai";
    getRepoMock.mockResolvedValue(repo);
    getReadmeMock.mockResolvedValue("# Hello World\nA demo repo.");
    getLanguagesMock.mockResolvedValue(languages);
    getRecentCommitsMock.mockResolvedValue(commits);
    isDbConfiguredMock.mockReturnValue(false);
    streamTextMock.mockReturnValue({
      toTextStreamResponse: () => new Response("stream"),
    });
  });

  it("throws when no AI provider is configured", async () => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = undefined;

    await expect(
      streamRepoChat({ owner: "octocat", repo: "hello-world", messages: [] }),
    ).rejects.toBeInstanceOf(NoAiProviderConfiguredError);
  });

  it("streams a grounded response using the repo context", async () => {
    const response = await streamRepoChat({
      owner: "octocat",
      repo: "hello-world",
      messages: [{ role: "user", content: "What is this repo?" }],
    });

    expect(response).toBeInstanceOf(Response);
    const [call] = streamTextMock.mock.calls[0];
    expect(call).toMatchObject({
      model: { provider: "openai", model: "gpt-4o-mini" },
      temperature: 0.3,
    });
    expect(call.system).toContain("octocat/hello-world");
    expect(call.system).toContain("A demo repo");
    expect(call.messages).toEqual([
      { role: "user", content: "What is this repo?" },
    ]);
  });

  it("persists the user and assistant turns when a database is configured", async () => {
    isDbConfiguredMock.mockReturnValue(true);
    getChatHistoryMock.mockResolvedValue([]);

    await streamRepoChat({
      owner: "octocat",
      repo: "hello-world",
      messages: [{ role: "user", content: "What is this repo?" }],
    });

    const [call] = streamTextMock.mock.calls[0];
    await call.onFinish({ text: "It is a demo." });

    expect(appendChatMessageMock).toHaveBeenNthCalledWith(
      1,
      "octocat",
      "hello-world",
      "user",
      "What is this repo?",
    );
    expect(appendChatMessageMock).toHaveBeenNthCalledWith(
      2,
      "octocat",
      "hello-world",
      "assistant",
      "It is a demo.",
    );
  });

  it("does not duplicate a user message already persisted", async () => {
    isDbConfiguredMock.mockReturnValue(true);
    getChatHistoryMock.mockResolvedValue([
      {
        id: "1",
        owner: "octocat",
        repo: "hello-world",
        role: "user",
        content: "What is this repo?",
        createdAt: new Date(),
      },
    ]);

    await streamRepoChat({
      owner: "octocat",
      repo: "hello-world",
      messages: [{ role: "user", content: "What is this repo?" }],
    });

    const [call] = streamTextMock.mock.calls[0];
    await call.onFinish({ text: "It is a demo." });

    expect(appendChatMessageMock).toHaveBeenCalledTimes(1);
    expect(appendChatMessageMock).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      "assistant",
      "It is a demo.",
    );
  });
});

describe("buildRepoContext / buildSystemPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRepoMock.mockResolvedValue(repo);
    getReadmeMock.mockResolvedValue("# Hello World\nA demo repo.");
    getLanguagesMock.mockResolvedValue(languages);
    getRecentCommitsMock.mockResolvedValue(commits);
  });

  it("builds a context with repo, readme, languages, and commits", async () => {
    const context = await buildRepoContext("octocat", "hello-world");

    expect(context.repository.fullName).toBe("octocat/hello-world");
    expect(context.readme).toContain("Hello World");
    expect(context.languages).toEqual(languages);
    expect(context.commits).toEqual(commits);
    expect(getRepoMock).toHaveBeenCalledWith("octocat", "hello-world");
    expect(getReadmeMock).toHaveBeenCalledWith("octocat", "hello-world");
    expect(getLanguagesMock).toHaveBeenCalledWith("octocat", "hello-world");
    expect(getRecentCommitsMock).toHaveBeenCalledWith("octocat", "hello-world", {
      perPage: 8,
    });
  });

  it("formats languages by percentage", () => {
    const prompt = buildSystemPrompt({
      repository: repo,
      readme: "# Hello World",
      languages: { TypeScript: 900, JavaScript: 100 },
      commits: [],
    });

    expect(prompt).toContain("TypeScript (90%)");
    expect(prompt).toContain("JavaScript (10%)");
  });

  it("truncates very long readmes", () => {
    const prompt = buildSystemPrompt({
      repository: repo,
      readme: "x".repeat(10_000),
      languages: {},
      commits: [],
    });

    expect(prompt).toContain("…(truncated)");
  });
});
