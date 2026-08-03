import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommitList } from "./commit-list";
import type { GithubCommit } from "@/lib/github";

const commits: GithubCommit[] = [
  {
    sha: "abcdef1234567890",
    htmlUrl: "https://github.com/octocat/hello-world/commit/abcdef1234567890",
    message: "Fix the bug",
    authorLogin: "octocat",
    authorAvatarUrl: "https://avatars.githubusercontent.com/u/1",
    committedAt: "2024-06-10T12:00:00Z",
  },
  {
    sha: "123456abcdef7890",
    htmlUrl: "https://github.com/octocat/hello-world/commit/123456abcdef7890",
    message: "Add a feature",
    authorLogin: null,
    authorAvatarUrl: null,
    committedAt: "2024-06-01T12:00:00Z",
  },
];

describe("CommitList", () => {
  it("renders commit messages and short shas", () => {
    render(<CommitList commits={commits} owner="octocat" repo="hello-world" />);

    expect(screen.getByText("Fix the bug")).toBeInTheDocument();
    expect(screen.getByText("Add a feature")).toBeInTheDocument();
    expect(screen.getByText("abcdef1")).toBeInTheDocument();
  });

  it("links each commit to its GitHub page", () => {
    render(<CommitList commits={commits} owner="octocat" repo="hello-world" />);

    expect(screen.getByRole("link", { name: "Fix the bug" })).toHaveAttribute(
      "href",
      "https://github.com/octocat/hello-world/commit/abcdef1234567890",
    );
  });

  it("renders the author when present", () => {
    render(<CommitList commits={commits} owner="octocat" repo="hello-world" />);

    expect(screen.getByText(/committed by octocat/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no commits", () => {
    render(<CommitList commits={[]} owner="octocat" repo="hello-world" />);

    expect(screen.getByText("No commits found.")).toBeInTheDocument();
  });
});
