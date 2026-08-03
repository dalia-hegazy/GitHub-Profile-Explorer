import type { RawBranch, RawCommit, RawRepo, RawUser } from "./schemas";
import type { GithubBranch, GithubCommit, GithubRepo, GithubUser } from "./types";

export function mapUser(raw: RawUser): GithubUser {
  return {
    id: raw.id,
    login: raw.login,
    name: raw.name,
    avatarUrl: raw.avatar_url,
    htmlUrl: raw.html_url,
    bio: raw.bio,
    company: raw.company,
    location: raw.location,
    blog: raw.blog,
    followers: raw.followers,
    following: raw.following,
    publicRepos: raw.public_repos,
    publicGists: raw.public_gists,
    createdAt: raw.created_at,
    type: raw.type,
  };
}

export function mapRepo(raw: RawRepo): GithubRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    htmlUrl: raw.html_url,
    homepage: raw.homepage,
    fork: raw.fork,
    language: raw.language,
    stargazersCount: raw.stargazers_count,
    forksCount: raw.forks_count,
    watchersCount: raw.watchers_count,
    openIssuesCount: raw.open_issues_count,
    defaultBranch: raw.default_branch,
    topics: raw.topics,
    license: raw.license?.spdx_id ?? null,
    pushedAt: raw.pushed_at,
    updatedAt: raw.updated_at,
    ownerLogin: raw.owner.login,
    ownerAvatarUrl: raw.owner.avatar_url,
  };
}

export function mapCommit(raw: RawCommit): GithubCommit {
  return {
    sha: raw.sha,
    htmlUrl: raw.html_url,
    message: raw.commit.message,
    authorLogin: raw.author?.login ?? raw.commit.author?.name ?? null,
    authorAvatarUrl: raw.author?.avatar_url ?? null,
    committedAt: raw.commit.author?.date ?? "",
  };
}

export function mapBranch(raw: RawBranch): GithubBranch {
  return {
    name: raw.name,
    commitSha: raw.commit.sha,
  };
}
