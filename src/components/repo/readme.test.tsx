import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Readme } from "./readme";

describe("Readme", () => {
  it("renders markdown content", () => {
    render(<Readme content={"# Hello\n\nSome **bold** text with `code`."} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Some/)).toBeInTheDocument();
    expect(screen.getByText("bold")).toHaveProperty("tagName", "STRONG");
  });

  it("shows an empty state when there is no readme", () => {
    render(<Readme content={null} />);

    expect(
      screen.getByText("This repository has no README."),
    ).toBeInTheDocument();
  });
});
