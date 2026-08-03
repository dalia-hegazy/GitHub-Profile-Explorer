import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { NoAiProviderConfiguredError } from "@/lib/ai/provider";
import { GithubError } from "@/lib/github";

const streamRepoChatMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/chat", () => ({
  streamRepoChat: streamRepoChatMock,
}));

vi.mock("@/lib/ai/provider", () => ({
  NoAiProviderConfiguredError: class NoAiProviderConfiguredError extends Error {},
}));

vi.mock("@/lib/github", () => ({
  GithubError: class GithubError extends Error {
    code: string;
    constructor(message: string, opts: { code: string }) {
      super(message);
      this.code = opts.code;
    }
  },
}));

async function callPost(body: unknown, owner = "octocat", repo = "hello-world") {
  return POST(
    new Request("http://localhost/api/repos/octocat/hello-world/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ owner, repo }) },
  );
}

describe("chat route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamRepoChatMock.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("streams a response for a valid request", async () => {
    const response = await callPost({
      messages: [{ role: "user", content: "What does this repo do?" }],
    });

    expect(response.status).toBe(200);
    expect(streamRepoChatMock).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "hello-world",
      messages: [{ role: "user", content: "What does this repo do?" }],
    });
  });

  it("rejects invalid owner or repo", async () => {
    const response = await callPost(
      { messages: [{ role: "user", content: "hi" }] },
      "bad owner!",
      "hello-world",
    );

    expect(response.status).toBe(400);
    expect(streamRepoChatMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or malformed body", async () => {
    const response = await callPost(null);
    expect(response.status).toBe(400);
    expect(streamRepoChatMock).not.toHaveBeenCalled();
  });

  it("rejects empty messages", async () => {
    const response = await callPost({ messages: [] });
    expect(response.status).toBe(400);
    expect(streamRepoChatMock).not.toHaveBeenCalled();
  });

  it("requires the last message to be from the user", async () => {
    const response = await callPost({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });
    expect(response.status).toBe(400);
    expect(streamRepoChatMock).not.toHaveBeenCalled();
  });

  it("returns 503 when no AI provider is configured", async () => {
    streamRepoChatMock.mockRejectedValue(new NoAiProviderConfiguredError());

    const response = await callPost({
      messages: [{ role: "user", content: "hi" }],
    });

    expect(response.status).toBe(503);
  });

  it("returns 404 for unknown repos", async () => {
    streamRepoChatMock.mockRejectedValue(
      new GithubError("not found", { code: "not_found" }),
    );

    const response = await callPost({
      messages: [{ role: "user", content: "hi" }],
    });

    expect(response.status).toBe(404);
  });
});
