import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("HomePage", () => {
  it("renders the page heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "GitHub Profile Explorer" }),
    ).toBeInTheDocument();
  });

  it("renders the username search form", () => {
    render(<HomePage />);
    expect(screen.getByLabelText("GitHub username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });
});
