import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RepoDetailHeader } from "./repo-detail-header";
import type { GithubRepo } from "@/lib/github";

const repo: GithubRepo = {
  id: 1,
  name: "hello-world",
  fullName: "octocat/hello-world",
  description: "My first repository",
  htmlUrl: "https://github.com/octocat/hello-world",
  homepage: "https://example.com",
  fork: false,
  language: "TypeScript",
  stargazersCount: 1500,
  forksCount: 42,
  watchersCount: 1500,
  openIssuesCount: 3,
  defaultBranch: "main",
  topics: ["demo"],
  license: "MIT",
  pushedAt: "2024-06-10T12:00:00Z",
  updatedAt: "2024-06-10T12:00:00Z",
  ownerLogin: "octocat",
  ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1",
};

describe("RepoDetailHeader", () => {
  it("renders the owner, name, and description", () => {
    render(<RepoDetailHeader repo={repo} />);

    expect(screen.getByRole("heading", { name: "hello-world" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "octocat" })).toHaveAttribute(
      "href",
      "/u/octocat",
    );
    expect(screen.getByText("My first repository")).toBeInTheDocument();
  });

  it("renders stats with compact numbers", () => {
    render(<RepoDetailHeader repo={repo} />);

    expect(screen.getAllByText("1.5K")).toHaveLength(2);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("open issues")).toBeInTheDocument();
  });

  it("renders language, license, and topic badges", () => {
    render(<RepoDetailHeader repo={repo} />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("demo")).toBeInTheDocument();
  });

  it("links to the repo on GitHub", () => {
    render(<RepoDetailHeader repo={repo} />);

    expect(screen.getByRole("link", { name: "View on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/octocat/hello-world",
    );
  });
});
