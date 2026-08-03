import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompareView } from "./compare-view";
import type { UserStats } from "@/lib/github";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; priority?: boolean }) => {
    const { src, alt, priority, ...rest } = props;
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} {...rest} />
    );
  },
}));

function makeStats(login: string, overrides: Partial<UserStats> = {}): UserStats {
  return {
    user: {
      id: 1,
      login,
      name: null,
      avatarUrl: `https://avatars.githubusercontent.com/u/${login}`,
      htmlUrl: `https://github.com/${login}`,
      bio: null,
      company: null,
      location: null,
      blog: null,
      followers: 100,
      following: 20,
      publicRepos: 5,
      publicGists: 1,
      createdAt: "2011-01-25T18:44:36Z",
      type: "User",
    },
    reposCount: 5,
    followers: 100,
    following: 20,
    totalStars: 500,
    totalForks: 50,
    topLanguage: "TypeScript",
    commitsLast30Days: 10,
    accountAgeYears: 13,
    ...overrides,
  };
}

describe("CompareView", () => {
  it("renders both users and metric labels", () => {
    render(
      <CompareView statsA={makeStats("octocat")} statsB={makeStats("torvalds")} />,
    );

    expect(screen.getByText("@octocat")).toBeInTheDocument();
    expect(screen.getByText("@torvalds")).toBeInTheDocument();
    expect(screen.getByText("Repositories")).toBeInTheDocument();
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("Commits (last 30 days)")).toBeInTheDocument();
    expect(screen.getByText("Account age (years)")).toBeInTheDocument();
  });

  it("renders both metric values", () => {
    render(
      <CompareView statsA={makeStats("octocat")} statsB={makeStats("torvalds")} />,
    );

    expect(screen.getAllByText("5")).toHaveLength(2);
    expect(screen.getAllByText("100")).toHaveLength(2);
  });

  it("renders the top language badge", () => {
    render(
      <CompareView statsA={makeStats("octocat")} statsB={makeStats("torvalds")} />,
    );

    expect(screen.getAllByText("TypeScript")).not.toHaveLength(0);
  });
});
