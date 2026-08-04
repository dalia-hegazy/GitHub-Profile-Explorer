import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileSummaryContext } from "./summary";
import { ProfileSummaryError, generateProfileSummary } from "./summary";
import { NoAiProviderConfiguredError } from "./provider";

const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY: "AQ.test-key" as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY_2: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY_3: undefined as string | undefined,
}));

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({ env: mockEnv }));

vi.mock("@ai-sdk/openai", () => ({
  openai: (model: string) => ({ provider: "openai", model }),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (model: string) => ({ provider: "anthropic", model }),
}));

vi.mock("@ai-sdk/google", () => ({
  google: (model: string) => ({ provider: "google", model }),
  createGoogle: () => ({
    languageModel: (model: string) => ({ provider: "google", model }),
  }),
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
    mockEnv.ANTHROPIC_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_3 = undefined;
    generateTextMock.mockResolvedValue({ text: "# Overview\nA summary." });
  });

  it("throws when no AI provider is configured", async () => {
    mockEnv.OPENAI_API_KEY = undefined;

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

  it("falls back to the next model when the primary hits a rate limit", async () => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = "AQ.first";
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = "AQ.second";
    generateTextMock
      .mockRejectedValueOnce({ statusCode: 429, message: "quota exceeded" })
      .mockResolvedValueOnce({ text: "Fallback summary." });

    await expect(generateProfileSummary(context)).resolves.toBe("Fallback summary.");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
    const models = generateTextMock.mock.calls.map(([call]) => call.model);
    expect(models[0]).toEqual({ provider: "google", model: "gemini-3.6-flash" });
    expect(models[1]).toEqual({ provider: "google", model: "gemini-3.6-flash" });
  });
});
