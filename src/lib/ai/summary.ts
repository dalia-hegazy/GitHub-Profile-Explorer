import "server-only";

import { generateText } from "ai";

import type { GithubRepo, GithubUser } from "@/lib/github/types";

import { NoAiProviderConfiguredError, getLanguageModel } from "./provider";

export interface ProfileSummaryContext {
  user: Pick<
    GithubUser,
    | "login"
    | "name"
    | "bio"
    | "company"
    | "location"
    | "blog"
    | "followers"
    | "following"
    | "publicRepos"
    | "createdAt"
  >;
  topRepos: Array<
    Pick<
      GithubRepo,
      | "name"
      | "description"
      | "language"
      | "stargazersCount"
      | "forksCount"
      | "topics"
      | "homepage"
    >
  >;
}

export class ProfileSummaryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProfileSummaryError";
  }
}

const SYSTEM_PROMPT = `You are an expert GitHub analyst. Given a GitHub user's profile and their top repositories, write a concise, balanced summary in Markdown. Ground every claim in the provided data; do not invent facts. Use these sections:

## Overview
2-3 sentences about who this developer is based on their profile.

## Strengths
A short bulleted list (2-4 bullets) of notable strengths backed by the data.

## Areas of interest
1-2 sentences describing the technologies and domains they appear to work in, based on repository languages and topics.

Keep the whole summary under 220 words. Use plain Markdown (no H1).`;

export async function generateProfileSummary(
  context: ProfileSummaryContext,
): Promise<string> {
  const model = getLanguageModel();
  if (!model) {
    throw new NoAiProviderConfiguredError();
  }

  try {
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Here is the profile data:\n\n${JSON.stringify(context, null, 2)}\n\nWrite the summary.`,
      temperature: 0.4,
    });
    return text.trim();
  } catch (error) {
    throw new ProfileSummaryError("Failed to generate the profile summary.", {
      cause: error,
    });
  }
}
