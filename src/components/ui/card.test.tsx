import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

describe("Card", () => {
  it("renders header, title, description, and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>All public repos</CardDescription>
        </CardHeader>
        <CardContent>Repo list goes here</CardContent>
      </Card>,
    );

    expect(
      screen.getByRole("heading", { name: "Repositories" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All public repos")).toBeInTheDocument();
    expect(screen.getByText("Repo list goes here")).toBeInTheDocument();
  });
});
