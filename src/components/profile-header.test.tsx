import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileHeader } from "./profile-header";
import type { GithubUser } from "@/lib/github";

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

const user: GithubUser = {
  id: 1,
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/1",
  htmlUrl: "https://github.com/octocat",
  bio: "Hello world",
  company: "@github",
  location: "San Francisco",
  blog: "https://octocat.dev",
  followers: 1000,
  following: 200,
  publicRepos: 5,
  publicGists: 1,
  createdAt: "2011-01-25T18:44:36Z",
  type: "User",
};

describe("ProfileHeader", () => {
  it("renders the display name, login, and avatar", () => {
    render(<ProfileHeader user={user} />);

    expect(screen.getByRole("heading", { name: "The Octocat" })).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
    expect(screen.getByAltText("octocat avatar")).toHaveAttribute(
      "src",
      "https://avatars.githubusercontent.com/u/1",
    );
  });

  it("renders bio and follower statistics", () => {
    render(<ProfileHeader user={user} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("1K")).toBeInTheDocument();
    expect(screen.getByText("followers")).toBeInTheDocument();
    expect(screen.getByText("following")).toBeInTheDocument();
    expect(screen.getByText("repositories")).toBeInTheDocument();
  });

  it("links to the profile on GitHub", () => {
    render(<ProfileHeader user={user} />);

    const link = screen.getByRole("link", { name: "View on GitHub" });
    expect(link).toHaveAttribute("href", "https://github.com/octocat");
  });

  it("falls back to the login when there is no name", () => {
    render(<ProfileHeader user={{ ...user, name: null }} />);

    expect(screen.getByRole("heading", { name: "octocat" })).toBeInTheDocument();
  });
});
