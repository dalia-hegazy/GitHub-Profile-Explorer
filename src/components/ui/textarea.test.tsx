import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders with a placeholder", () => {
    render(<Textarea placeholder="Write something…" />);
    expect(screen.getByPlaceholderText("Write something…")).toBeInTheDocument();
  });

  it("exposes an accessible name via aria-label", () => {
    render(<Textarea aria-label="Note content" />);
    expect(screen.getByLabelText("Note content")).toBeInTheDocument();
  });
});
