export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string;
  type: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  fork: boolean;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  topics: string[];
  license: string | null;
  pushedAt: string | null;
  updatedAt: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
}

export interface ReposPage {
  repos: GithubRepo[];
  page: number;
  hasNextPage: boolean;
}

export interface GithubCommit {
  sha: string;
  htmlUrl: string;
  message: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  committedAt: string;
}

export interface GithubBranch {
  name: string;
  commitSha: string;
}

export interface RepoLanguages {
  [language: string]: number;
}
