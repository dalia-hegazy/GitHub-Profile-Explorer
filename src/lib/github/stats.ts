import "server-only";

import { getRecentCommits } from "./repos";
import { getUser, getUserRepos } from "./users";
import type { GithubCommit, GithubRepo, GithubUser } from "./types";

export interface UserStats {
  user: GithubUser;
  reposCount: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  topLanguage: string | null;
  commitsLast30Days: number;
  accountAgeYears: number;
}

const COMMIT_WINDOW_DAYS = 30;
const COMMIT_SAMPLE_REPOS = 5;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function accountAgeYears(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  const ageMs = Date.now() - created;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365));
}

function topLanguage(repos: GithubRepo[]): string | null {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [language, count] of counts) {
    if (count > bestCount) {
      best = language;
      bestCount = count;
    }
  }
  return best;
}

export async function getUserStats(username: string): Promise<UserStats> {
  const [user, reposPage] = await Promise.all([
    getUser(username),
    getUserRepos(username, { perPage: 100, sort: "updated", direction: "desc" }),
  ]);

  const repos = reposPage.repos;
  const since = daysAgoIso(COMMIT_WINDOW_DAYS);
  const sampleRepos = repos
    .slice()
    .sort((a, b) => (b.pushedAt ?? "").localeCompare(a.pushedAt ?? ""))
    .slice(0, COMMIT_SAMPLE_REPOS);

  const commitBatches = await Promise.all(
    sampleRepos.map((repo) =>
      getRecentCommits(repo.ownerLogin, repo.name, {
        since,
        perPage: 100,
      }).catch((): GithubCommit[] => []),
    ),
  );
  const commitsLast30Days = commitBatches.reduce(
    (total, batch) => total + batch.length,
    0,
  );

  return {
    user,
    reposCount: user.publicRepos,
    followers: user.followers,
    following: user.following,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazersCount, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forksCount, 0),
    topLanguage: topLanguage(repos),
    commitsLast30Days,
    accountAgeYears: accountAgeYears(user.createdAt),
  };
}
