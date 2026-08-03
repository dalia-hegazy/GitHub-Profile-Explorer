import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
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

/**
 * Resolves a language model based on the configured API keys.
 * Prefers OpenAI, then Google, then Anthropic. Returns null when none is set.
 */
export function getLanguageModel(): LanguageModel | null {
  if (env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google("gemini-3.6-flash");
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
