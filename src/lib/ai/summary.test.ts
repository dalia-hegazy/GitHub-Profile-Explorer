import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileSummaryContext } from "./summary";
import { ProfileSummaryError, generateProfileSummary } from "./summary";
import { NoAiProviderConfiguredError } from "./provider";

const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
}));

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({ env: mockEnv }));

vi.mock("@ai-sdk/openai", () => ({
  openai: (model: string) => ({ provider: "openai", model }),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (model: string) => ({ provider: "anthropic", model }),
}));

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

const context: ProfileSummaryContext = {
  user: {
    login: "octocat",
    name: "The Octocat",
    bio: "Creator of the Octocat.",
    company: "GitHub",
    location: "San Francisco",
    blog: "https://github.blog",
    followers: 8000,
    following: 9,
    publicRepos: 8,
    createdAt: "2011-01-25T18:44:36Z",
  },
  topRepos: [
    {
      name: "hello-world",
      description: "My first repo",
      language: "TypeScript",
      stargazersCount: 42,
      forksCount: 7,
      topics: ["demo", "octocat"],
      homepage: null,
    },
  ],
};

describe("generateProfileSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.OPENAI_API_KEY = "sk-openai";
    generateTextMock.mockResolvedValue({ text: "# Overview\nA summary." });
  });

  it("throws when no AI provider is configured", async () => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;

    await expect(generateProfileSummary(context)).rejects.toBeInstanceOf(
      NoAiProviderConfiguredError,
    );
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("returns the generated summary text", async () => {
    const summary = await generateProfileSummary(context);

    expect(summary).toBe("# Overview\nA summary.");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    const [call] = generateTextMock.mock.calls[0];
    expect(call).toMatchObject({
      model: { provider: "openai", model: "gpt-4o-mini" },
      temperature: 0.4,
    });
  });

  it("passes the profile context into the prompt", async () => {
    await generateProfileSummary(context);

    const [call] = generateTextMock.mock.calls[0];
    expect(call.prompt).toContain('"login": "octocat"');
    expect(call.prompt).toContain('"hello-world"');
  });

  it("wraps provider failures in ProfileSummaryError", async () => {
    generateTextMock.mockRejectedValueOnce(new Error("rate limited"));

    await expect(generateProfileSummary(context)).rejects.toBeInstanceOf(ProfileSummaryError);
  });
});
