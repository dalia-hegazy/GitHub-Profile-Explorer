import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getGoogleModels,
  getLanguageModel,
  getLanguageModels,
  getProviderName,
} from "./provider";

const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY_2: undefined as string | undefined,
  GOOGLE_GENERATIVE_AI_API_KEY_3: undefined as string | undefined,
}));

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

describe("getGoogleModels", () => {
  beforeEach(() => {
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_3 = undefined;
  });

  it("returns one model per configured key", () => {
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = "k1";
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_3 = "k3";

    const models = getGoogleModels();
    expect(models).toHaveLength(2);
    for (const model of models) {
      expect(model).toMatchObject({ provider: "google", model: "gemini-3.6-flash" });
    }
  });

  it("returns an empty array when no Google keys are set", () => {
    expect(getGoogleModels()).toEqual([]);
  });
});

describe("getLanguageModels", () => {
  beforeEach(() => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_3 = undefined;
  });

  it("returns an empty list when no provider is configured", () => {
    expect(getLanguageModels()).toEqual([]);
  });

  it("orders OpenAI first, then Google keys, then Anthropic", () => {
    mockEnv.OPENAI_API_KEY = "sk-openai";
    mockEnv.ANTHROPIC_API_KEY = "sk-anthropic";
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = "k2";

    const providers = getLanguageModels().map((m) => (m as { provider: string }).provider);
    expect(providers).toEqual(["openai", "google", "anthropic"]);
  });
});

describe("getLanguageModel (legacy)", () => {
  beforeEach(() => {
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_2 = undefined;
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY_3 = undefined;
  });

  it("returns null when no provider is configured", () => {
    expect(getLanguageModel()).toBeNull();
    expect(getProviderName()).toBeNull();
  });

  it("prefers OpenAI when set", () => {
    mockEnv.OPENAI_API_KEY = "sk-openai";
    mockEnv.ANTHROPIC_API_KEY = "sk-anthropic";

    expect(getProviderName()).toBe("openai");
    const model = getLanguageModel();
    expect(model).toMatchObject({ provider: "openai", model: "gpt-4o-mini" });
  });

  it("uses Google when only the Google key is set", () => {
    mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = "google-key";

    expect(getProviderName()).toBe("google");
    const model = getLanguageModel();
    expect(model).toMatchObject({ provider: "google", model: "gemini-3.6-flash" });
  });

  it("falls back to Anthropic when only Anthropic is set", () => {
    mockEnv.ANTHROPIC_API_KEY = "sk-anthropic";

    expect(getProviderName()).toBe("anthropic");
    const model = getLanguageModel();
    expect(model).toMatchObject({ provider: "anthropic", model: "claude-haiku-4-5" });
  });
});