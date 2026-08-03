import "server-only";

import { z } from "zod";

import { githubFetch, parseNextPage } from "./client";
import { GithubError } from "./errors";
import { mapRepo, mapUser } from "./mappers";
import { rawRepoSchema, rawUserSchema } from "./schemas";
import type { GithubRepo, GithubUser, ReposPage } from "./types";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required.")
  .max(39, "GitHub usernames are at most 39 characters long.")
  .regex(
    /^[a-zA-Z0-9-]+$/,
    "GitHub usernames may only contain letters, numbers, and hyphens.",
  );

function assertUsername(username: string): string {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid GitHub username.";
    throw new GithubError(message, { code: "validation" });
  }
  return parsed.data;
}

export async function getUser(username: string): Promise<GithubUser> {
  const login = assertUsername(username);
  const response = await githubFetch(`/users/${encodeURIComponent(login)}`);
  const raw = rawUserSchema.parse(await response.json());
  return mapUser(raw);
}

export interface ReposQuery {
  page?: number;
  perPage?: number;
  sort?: "updated" | "created" | "stars" | "full_name";
  direction?: "asc" | "desc";
}

export async function getUserRepos(
  username: string,
  query: ReposQuery = {},
): Promise<ReposPage> {
  const login = assertUsername(username);
  const page = query.page ?? 1;
  const perPage = Math.min(Math.max(query.perPage ?? 30, 1), 100);
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort: query.sort ?? "updated",
    direction: query.direction ?? "desc",
  });

  const response = await githubFetch(
    `/users/${encodeURIComponent(login)}/repos?${params.toString()}`,
  );
  const rawRepos = z.array(rawRepoSchema).parse(await response.json());
  const repos: GithubRepo[] = rawRepos.map(mapRepo);
  const nextPage = parseNextPage(response);

  return {
    repos,
    page,
    hasNextPage: nextPage !== null && nextPage > page,
  };
}
