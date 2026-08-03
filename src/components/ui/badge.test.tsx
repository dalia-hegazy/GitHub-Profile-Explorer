import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>Stars</Badge>);
    expect(screen.getByText("Stars")).toBeInTheDocument();
  });

  it("applies the secondary variant classes", () => {
    expect(badgeVariants({ variant: "secondary" })).toContain("bg-secondary");
  });
});
