import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RepoChat } from "@/components/chat/repo-chat";
import { CommitList } from "@/components/repo/commit-list";
import { LanguageBreakdown } from "@/components/repo/language-breakdown";
import { Readme } from "@/components/repo/readme";
import { RepoDetailHeader } from "@/components/repo/repo-detail-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteSection } from "@/components/notes/note-section";
import { getChatHistory } from "@/db/chat";
import {
  GithubError,
  getLanguages,
  getReadme,
  getRecentCommits,
  getRepo,
} from "@/lib/github";

interface RepoPageProps {
  params: Promise<{ username: string; repo: string }>;
}

export async function generateMetadata({ params }: RepoPageProps): Promise<Metadata> {
  const { username, repo } = await params;
  try {
    const repository = await getRepo(username, repo);
    return {
      title: `${repository.name} · ${repository.ownerLogin}`,
      description: repository.description ?? `Repository ${repository.fullName}.`,
    };
  } catch (error) {
    if (error instanceof GithubError && error.code === "not_found") {
      return { title: "Repository not found" };
    }
    throw error;
  }
}

export default async function RepoPage({ params }: RepoPageProps) {
  const { username, repo } = await params;

  let repository;
  let readme;
  let languages;
  let commits;
  try {
    [repository, readme, languages, commits] = await Promise.all([
      getRepo(username, repo),
      getReadme(username, repo),
      getLanguages(username, repo),
      getRecentCommits(username, repo, { perPage: 10 }),
    ]);
  } catch (error) {
    if (error instanceof GithubError && error.code === "not_found") {
      notFound();
    }
    throw error;
  }

  const chatHistory = await getChatHistory(username, repo);
  const initialMessages = chatHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <RepoDetailHeader repo={repository} />
      {Object.keys(languages).length > 0 ? (
        <LanguageBreakdown languages={languages} />
      ) : null}
      <CommitList
        commits={commits}
        owner={repository.ownerLogin}
        repo={repository.name}
      />
      <Readme content={readme} />
      <Card>
        <CardHeader>
          <CardTitle>Ask about this repo</CardTitle>
          <CardDescription>
            Grounded answers about the README, languages, and recent commits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepoChat
            owner={repository.ownerLogin}
            repo={repository.name}
            initialMessages={initialMessages}
          />
        </CardContent>
      </Card>
      <NoteSection
        scope="repo"
        owner={repository.ownerLogin}
        repo={repository.name}
        title="Repository notes"
      />
    </div>
  );
}
