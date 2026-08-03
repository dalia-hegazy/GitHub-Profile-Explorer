import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLanguageModel, getProviderName } from "./provider";

const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

vi.mock("@ai-sdk/openai", () => ({
  openai: (model: string) => ({ provider: "openai", model }),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (model: string) => ({ provider: "anthropic", model }),
}));

describe("AI provider selection", () => {
  beforeEach(() => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
  });

  it("returns null when no provider is configured", () => {
    expect(getLanguageModel()).toBeNull();
    expect(getProviderName()).toBeNull();
  });

  it("prefers OpenAI when both keys are set", () => {
    mockEnv.OPENAI_API_KEY = "sk-openai";
    mockEnv.ANTHROPIC_API_KEY = "sk-anthropic";

    expect(getProviderName()).toBe("openai");
    const model = getLanguageModel();
    expect(model).toMatchObject({ provider: "openai", model: "gpt-4o-mini" });
  });

  it("falls back to Anthropic when only Anthropic is set", () => {
    mockEnv.ANTHROPIC_API_KEY = "sk-anthropic";

    expect(getProviderName()).toBe("anthropic");
    const model = getLanguageModel();
    expect(model).toMatchObject({ provider: "anthropic", model: "claude-haiku-4-5" });
  });
});
