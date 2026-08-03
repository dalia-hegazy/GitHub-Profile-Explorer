import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RepoChat } from "./repo-chat";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe("RepoChat", () => {
  it("shows an empty state when there are no messages", () => {
    render(<RepoChat owner="octocat" repo="hello-world" />);

    expect(screen.getByText(/Ask a question about this repository/)).toBeInTheDocument();
  });

  it("renders initial persisted messages", () => {
    render(
      <RepoChat
        owner="octocat"
        repo="hello-world"
        initialMessages={[
          { role: "user", content: "What does this do?" },
          { role: "assistant", content: "It is a demo." },
        ]}
      />,
    );

    expect(screen.getByText("What does this do?")).toBeInTheDocument();
    expect(screen.getByText("It is a demo.")).toBeInTheDocument();
  });

  it("posts the conversation and renders the streamed reply", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(streamResponse(["Stream", "ing", " reply"]));

    render(<RepoChat owner="octocat" repo="hello-world" />);

    await user.type(screen.getByLabelText("Ask about this repository"), "What is this repo?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/repos/octocat/hello-world/chat");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.messages).toEqual([
      { role: "user", content: "What is this repo?" },
    ]);

    expect(await screen.findByText("Streaming reply")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "AI chat is not configured." }), {
        status: 503,
      }),
    );

    render(<RepoChat owner="octocat" repo="hello-world" />);

    await user.type(screen.getByLabelText("Ask about this repository"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "AI chat is not configured.",
    );
  });
});
