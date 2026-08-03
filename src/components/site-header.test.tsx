import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("links to the home page", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "GitHub Profile Explorer" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("links to the compare page", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute(
      "href",
      "/compare",
    );
  });
});
