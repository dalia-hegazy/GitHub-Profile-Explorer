import { z } from "zod";

export const rawUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string(),
  html_url: z.string(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  followers: z.number(),
  following: z.number(),
  public_repos: z.number(),
  public_gists: z.number(),
  created_at: z.string(),
  type: z.string(),
});

export type RawUser = z.infer<typeof rawUserSchema>;

export const rawRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  homepage: z.string().nullable(),
  fork: z.boolean(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  watchers_count: z.number(),
  open_issues_count: z.number(),
  default_branch: z.string(),
  topics: z.array(z.string()).default([]),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  pushed_at: z.string().nullable(),
  updated_at: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
  }),
});

export type RawRepo = z.infer<typeof rawRepoSchema>;

export const rawCommitSchema = z.object({
  sha: z.string(),
  html_url: z.string(),
  commit: z.object({
    message: z.string(),
    author: z
      .object({
        name: z.string().nullable(),
        date: z.string(),
      })
      .nullable(),
  }),
  author: z
    .object({
      login: z.string(),
      avatar_url: z.string(),
    })
    .nullable(),
});

export type RawCommit = z.infer<typeof rawCommitSchema>;

export const rawBranchSchema = z.object({
  name: z.string(),
  commit: z.object({
    sha: z.string(),
  }),
});

export type RawBranch = z.infer<typeof rawBranchSchema>;

export const rawLanguagesSchema = z.record(z.string(), z.number());

export const rawReadmeSchema = z.object({
  name: z.string(),
  path: z.string(),
  content: z.string(),
  encoding: z.string(),
});

export type RawReadme = z.infer<typeof rawReadmeSchema>;
