import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders a text input with its placeholder", () => {
    render(<Input placeholder="Username" />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  });

  it("passes the value on change", async () => {
    render(<Input aria-label="Username" />);
    const input = screen.getByLabelText("Username");
    await userEvent.type(input, "octocat");
    expect(input).toHaveValue("octocat");
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Input aria-label="Username" disabled />);
    expect(screen.getByLabelText("Username")).toBeDisabled();
  });
});
