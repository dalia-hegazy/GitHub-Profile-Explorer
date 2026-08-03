import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  ProfileSummary,
  ProfileSummarySkeleton,
} from "@/components/ai/profile-summary";
import { NoteSection } from "@/components/notes/note-section";
import { ProfileHeader } from "@/components/profile-header";
import { RepoList } from "@/components/repo-list";
import { GithubError, getUser, getUserRepos } from "@/lib/github";

interface UserPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { username } = await params;
  try {
    const user = await getUser(username);
    const displayName = user.name ?? user.login;
    return {
      title: `${displayName} (@${user.login})`,
      description: user.bio ?? `GitHub profile for ${user.login}.`,
    };
  } catch (error) {
    if (error instanceof GithubError && error.code === "not_found") {
      return { title: "User not found" };
    }
    throw error;
  }
}

export default async function UserPage({ params, searchParams }: UserPageProps) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const rawPage = resolvedSearchParams.page;
  const requestedPage = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let user;
  let reposPage;
  try {
    [user, reposPage] = await Promise.all([
      getUser(username),
      getUserRepos(username, { page }),
    ]);
  } catch (error) {
    if (error instanceof GithubError && error.code === "not_found") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <ProfileHeader user={user} />
      <Suspense fallback={<ProfileSummarySkeleton />}>
        <ProfileSummary username={user.login} />
      </Suspense>
      <RepoList username={user.login} reposPage={reposPage} />
      <NoteSection scope="user" owner={user.login} title="Profile notes" />
    </div>
  );
}
