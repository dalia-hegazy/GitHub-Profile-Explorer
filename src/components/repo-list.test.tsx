import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RepoList } from "./repo-list";
import type { GithubRepo, ReposPage } from "@/lib/github";

const repo: GithubRepo = {
  id: 1,
  name: "hello-world",
  fullName: "octocat/hello-world",
  description: "My first repository",
  htmlUrl: "https://github.com/octocat/hello-world",
  homepage: null,
  fork: false,
  language: "TypeScript",
  stargazersCount: 1500,
  forksCount: 42,
  watchersCount: 1500,
  openIssuesCount: 3,
  defaultBranch: "main",
  topics: ["demo", "hello"],
  license: "MIT",
  pushedAt: "2024-06-10T12:00:00Z",
  updatedAt: "2024-06-10T12:00:00Z",
  ownerLogin: "octocat",
  ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
};

function makePage(overrides: Partial<ReposPage> = {}): ReposPage {
  return {
    repos: [repo],
    page: 1,
    hasNextPage: true,
    ...overrides,
  };
}

describe("RepoList", () => {
  it("renders each repository's name and description", () => {
    render(<RepoList username="octocat" reposPage={makePage()} />);

    expect(
      screen.getByRole("heading", { name: "Repositories" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "hello-world" }),
    ).toHaveAttribute("href", "/u/octocat/hello-world");
    expect(screen.getByText("My first repository")).toBeInTheDocument();
  });

  it("renders language, stars, and forks", () => {
    render(<RepoList username="octocat" reposPage={makePage()} />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByLabelText("1500 stars")).toHaveTextContent("1.5K stars");
    expect(screen.getByLabelText("42 forks")).toHaveTextContent("42 forks");
  });

  it("shows an empty state when there are no repositories", () => {
    render(<RepoList username="octocat" reposPage={makePage({ repos: [] })} />);

    expect(
      screen.getByText("This user has no public repositories."),
    ).toBeInTheDocument();
  });

  it("links to the next page when more pages exist", () => {
    render(<RepoList username="octocat" reposPage={makePage()} />);

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/u/octocat?page=2",
    );
  });

  it("disables the previous link on the first page", () => {
    render(<RepoList username="octocat" reposPage={makePage()} />);

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables the next link when there are no more pages", () => {
    render(
      <RepoList username="octocat" reposPage={makePage({ hasNextPage: false })} />,
    );

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
