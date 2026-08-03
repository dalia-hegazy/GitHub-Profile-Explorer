import "server-only";

import { z } from "zod";

import { githubFetch } from "./client";
import { GithubError } from "./errors";
import { mapBranch, mapCommit, mapRepo } from "./mappers";
import {
  rawBranchSchema,
  rawCommitSchema,
  rawLanguagesSchema,
  rawReadmeSchema,
  rawRepoSchema,
} from "./schemas";
import type { GithubBranch, GithubCommit, GithubRepo, RepoLanguages } from "./types";

const ownerRepoSchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
});

function assertOwnerRepo(owner: string, repo: string): { owner: string; repo: string } {
  const parsed = ownerRepoSchema.safeParse({ owner, repo });
  if (!parsed.success) {
    throw new GithubError("Invalid repository name.", { code: "validation" });
  }
  return parsed.data;
}

export async function getRepo(owner: string, repo: string): Promise<GithubRepo> {
  const { owner: o, repo: r } = assertOwnerRepo(owner, repo);
  const response = await githubFetch(`/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}`, {
    revalidate: 3600,
  });
  const raw = rawRepoSchema.parse(await response.json());
  return mapRepo(raw);
}

export async function getReadme(owner: string, repo: string): Promise<string | null> {
  const { owner: o, repo: r } = assertOwnerRepo(owner, repo);
  let response: Response;
  try {
    response = await githubFetch(
      `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}/readme`,
      { revalidate: 3600 },
    );
  } catch (error) {
    if (error instanceof GithubError && error.code === "not_found") {
      return null;
    }
    throw error;
  }
  const raw = rawReadmeSchema.parse(await response.json());
  if (raw.encoding === "base64") {
    return Buffer.from(raw.content, "base64").toString("utf-8");
  }
  return raw.content;
}

export async function getLanguages(owner: string, repo: string): Promise<RepoLanguages> {
  const { owner: o, repo: r } = assertOwnerRepo(owner, repo);
  const response = await githubFetch(
    `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}/languages`,
    { revalidate: 3600 },
  );
  return rawLanguagesSchema.parse(await response.json());
}

export async function getBranches(owner: string, repo: string): Promise<GithubBranch[]> {
  const { owner: o, repo: r } = assertOwnerRepo(owner, repo);
  const response = await githubFetch(
    `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}/branches?per_page=100`,
    { revalidate: 3600 },
  );
  const raw = z.array(rawBranchSchema).parse(await response.json());
  return raw.map(mapBranch);
}

export interface CommitsQuery {
  perPage?: number;
  branch?: string;
  since?: string;
}

export async function getRecentCommits(
  owner: string,
  repo: string,
  query: CommitsQuery = {},
): Promise<GithubCommit[]> {
  const { owner: o, repo: r } = assertOwnerRepo(owner, repo);
  const perPage = Math.min(Math.max(query.perPage ?? 10, 1), 100);
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (query.branch) {
    params.set("sha", query.branch);
  }
  if (query.since) {
    params.set("since", query.since);
  }
  const response = await githubFetch(
    `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}/commits?${params.toString()}`,
    { revalidate: 300 },
  );
  const raw = z.array(rawCommitSchema).parse(await response.json());
  return raw.map(mapCommit);
}
