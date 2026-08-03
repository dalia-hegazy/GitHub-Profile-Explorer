import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserSearch } from "./user-search";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("UserSearch", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("navigates to the profile page on submit", async () => {
    const user = userEvent.setup();
    render(<UserSearch />);

    await user.type(screen.getByLabelText("GitHub username"), "octocat");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(pushMock).toHaveBeenCalledWith("/u/octocat");
  });

  it("rejects empty input with an error", async () => {
    const user = userEvent.setup();
    render(<UserSearch />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a GitHub username.");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rejects invalid usernames with an error", async () => {
    const user = userEvent.setup();
    render(<UserSearch />);

    await user.type(screen.getByLabelText("GitHub username"), "has space");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "GitHub usernames may only contain letters, numbers, and hyphens.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("encodes the username in the route", async () => {
    const user = userEvent.setup();
    render(<UserSearch />);

    await user.type(screen.getByLabelText("GitHub username"), "octo-cat");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(pushMock).toHaveBeenCalledWith("/u/octo-cat");
  });
});
