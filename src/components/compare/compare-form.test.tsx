import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompareForm } from "./compare-form";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("CompareForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("navigates to the compare route on submit", async () => {
    const user = userEvent.setup();
    render(<CompareForm />);

    await user.type(screen.getByLabelText("First GitHub username"), "octocat");
    await user.type(screen.getByLabelText("Second GitHub username"), "torvalds");
    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(pushMock).toHaveBeenCalledWith("/compare?u1=octocat&u2=torvalds");
  });

  it("rejects missing usernames", async () => {
    const user = userEvent.setup();
    render(<CompareForm />);

    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter two GitHub usernames.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rejects identical usernames", async () => {
    const user = userEvent.setup();
    render(<CompareForm />);

    await user.type(screen.getByLabelText("First GitHub username"), "octocat");
    await user.type(screen.getByLabelText("Second GitHub username"), "OctoCat");
    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please choose two different users.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("pre-fills existing usernames", () => {
    render(<CompareForm defaultUserA="octocat" defaultUserB="torvalds" />);

    expect(screen.getByLabelText("First GitHub username")).toHaveValue("octocat");
    expect(screen.getByLabelText("Second GitHub username")).toHaveValue("torvalds");
  });
});
