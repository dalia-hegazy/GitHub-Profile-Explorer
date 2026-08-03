import "server-only";

import { streamText } from "ai";

import { appendChatMessage, getChatHistory } from "@/db/chat";
import { isDbConfigured } from "@/db/client";
import { getLanguages, getReadme, getRecentCommits, getRepo } from "@/lib/github";
import type { GithubCommit, GithubRepo, RepoLanguages } from "@/lib/github/types";

import { NoAiProviderConfiguredError, getLanguageModel } from "./provider";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RepoContext {
  repository: GithubRepo;
  readme: string | null;
  languages: RepoLanguages;
  commits: GithubCommit[];
}

const MAX_README_CHARS = 6000;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\n…(truncated)` : text;
}

function formatLanguages(languages: RepoLanguages): string {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "No language data available.";
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries
    .map(([name, bytes]) => `${name} (${Math.round((bytes / total) * 100)}%)`)
    .join(", ");
}

function formatCommits(commits: GithubCommit[]): string {
  if (commits.length === 0) return "No recent commits found.";
  return commits
    .map((commit) => `- ${commit.message.split("\n")[0]} (${commit.sha.slice(0, 7)})`)
    .join("\n");
}

export async function buildRepoContext(owner: string, repo: string): Promise<RepoContext> {
  const [repository, readme, languages, commits] = await Promise.all([
    getRepo(owner, repo),
    getReadme(owner, repo),
    getLanguages(owner, repo),
    getRecentCommits(owner, repo, { perPage: 8 }),
  ]);
  return { repository, readme, languages, commits };
}

export function buildSystemPrompt(context: RepoContext): string {
  const { repository, readme, languages, commits } = context;
  const sections = [
    `You are an assistant answering questions about the GitHub repository ${repository.fullName}.`,
    `Answer strictly from the provided context below. If the context does not contain the answer, say you don't know rather than guessing.`,
    "",
    "## Repository details",
    `- Description: ${repository.description ?? "No description"}`,
    `- Default branch: ${repository.defaultBranch}`,
    `- Languages: ${formatLanguages(languages)}`,
    "",
    "## Recent commits",
    formatCommits(commits),
  ];

  if (readme) {
    sections.push("", "## README", truncate(readme, MAX_README_CHARS));
  }

  return sections.join("\n");
}

export interface RepoChatOptions {
  owner: string;
  repo: string;
  messages: ChatTurn[];
}

/**
 * Streams a grounded answer about a repository, returning a plain-text stream.
 * New turns are persisted to the chat history when a database is configured.
 */
export async function streamRepoChat({
  owner,
  repo,
  messages,
}: RepoChatOptions): Promise<Response> {
  const model = getLanguageModel();
  if (!model) {
    throw new NoAiProviderConfiguredError();
  }

  const context = await buildRepoContext(owner, repo);
  const system = buildSystemPrompt(context);

  const result = streamText({
    model,
    system,
    messages,
    temperature: 0.3,
    onFinish: async ({ text }) => {
      if (!isDbConfigured()) return;
      const history = await getChatHistory(owner, repo);
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const lastPersisted = history.at(-1);
      if (lastUser && lastPersisted?.content !== lastUser.content) {
        await appendChatMessage(owner, repo, "user", lastUser.content);
      }
      await appendChatMessage(owner, repo, "assistant", text);
    },
  });

  return result.toTextStreamResponse();
}
