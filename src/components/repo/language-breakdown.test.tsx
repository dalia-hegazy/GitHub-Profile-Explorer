import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LanguageBreakdown } from "./language-breakdown";

describe("LanguageBreakdown", () => {
  it("renders languages with percentages", () => {
    render(<LanguageBreakdown languages={{ TypeScript: 750, JavaScript: 250 }} />);

    expect(screen.getByRole("heading", { name: "Languages" })).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("renders nothing when there are no languages", () => {
    const { container } = render(<LanguageBreakdown languages={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
