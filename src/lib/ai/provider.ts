import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { env } from "@/lib/env";

export class NoAiProviderConfiguredError extends Error {
  constructor() {
    super(
      "No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY to enable AI features.",
    );
    this.name = "NoAiProviderConfiguredError";
  }
}

export const GOOGLE_MODEL = "gemini-3.6-flash";

/**
 * All Google (Gemini) language models that can be used, one per configured
 * API key. Enables automatic fallback between multiple free-tier keys.
 */
export function getGoogleModels(): LanguageModel[] {
  const keys = [
    env.GOOGLE_GENERATIVE_AI_API_KEY,
    env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    env.GOOGLE_GENERATIVE_AI_API_KEY_3,
  ].filter((key): key is string => Boolean(key));

  return keys.map((apiKey) =>
    createGoogle({ apiKey }).languageModel(GOOGLE_MODEL),
  );
}

/**
 * Ordered list of candidate language models to try, from most to least
 * preferred, across configured providers. Empty when none is configured.
 */
export function getLanguageModels(): LanguageModel[] {
  const models: LanguageModel[] = [];
  if (env.OPENAI_API_KEY) {
    models.push(openai("gpt-4o-mini"));
  }
  models.push(...getGoogleModels());
  if (env.ANTHROPIC_API_KEY) {
    models.push(anthropic("claude-haiku-4-5"));
  }
  return models;
}

/**
 * @deprecated Use {@link getLanguageModels} for multi-key support.
 */
export function getLanguageModel(): LanguageModel | null {
  if (env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return createGoogle().languageModel(GOOGLE_MODEL);
  }
  if (env.ANTHROPIC_API_KEY) {
    return anthropic("claude-haiku-4-5");
  }
  return null;
}

/** Returns the name of the provider that would be used, for display/telemetry. */
export function getProviderName(): "openai" | "google" | "anthropic" | null {
  if (env.OPENAI_API_KEY) return "openai";
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}
