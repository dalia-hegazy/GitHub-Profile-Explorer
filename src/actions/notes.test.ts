import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveNote } from "./notes";
import { DatabaseNotConfiguredError } from "@/db/notes";

const { revalidatePathMock, upsertNoteMock, isDbConfiguredMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  upsertNoteMock: vi.fn(),
  isDbConfiguredMock: vi.fn(() => true),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/db/notes", () => ({
  DatabaseNotConfiguredError: class DatabaseNotConfiguredError extends Error {},
  upsertNote: upsertNoteMock,
}));

vi.mock("@/db/client", () => ({
  isDbConfigured: isDbConfiguredMock,
}));

function formData(values: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) fd.set(key, value);
  }
  return fd;
}

describe("saveNote action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDbConfiguredMock.mockReturnValue(true);
  });

  it("saves a user note and revalidates the profile path", async () => {
    upsertNoteMock.mockResolvedValue({ id: "1" });

    const state = await saveNote({ status: "idle" }, formData({
      scope: "user",
      owner: "octocat",
      content: "Great contributor",
    }));

    expect(state.status).toBe("success");
    expect(upsertNoteMock).toHaveBeenCalledWith("user", "octocat", null, "Great contributor");
    expect(revalidatePathMock).toHaveBeenCalledWith("/u/octocat");
  });

  it("saves a repo note and revalidates the repo path", async () => {
    upsertNoteMock.mockResolvedValue({ id: "2" });

    const state = await saveNote({ status: "idle" }, formData({
      scope: "repo",
      owner: "octocat",
      repo: "hello-world",
      content: "Look at the readme",
    }));

    expect(state.status).toBe("success");
    expect(upsertNoteMock).toHaveBeenCalledWith("repo", "octocat", "hello-world", "Look at the readme");
    expect(revalidatePathMock).toHaveBeenCalledWith("/u/octocat/hello-world");
  });

  it("rejects empty content", async () => {
    const state = await saveNote({ status: "idle" }, formData({
      scope: "user",
      owner: "octocat",
      content: "   ",
    }));

    expect(state.status).toBe("error");
    expect(upsertNoteMock).not.toHaveBeenCalled();
  });

  it("rejects invalid usernames", async () => {
    const state = await saveNote({ status: "idle" }, formData({
      scope: "user",
      owner: "not valid!",
      content: "note",
    }));

    expect(state.status).toBe("error");
    expect(upsertNoteMock).not.toHaveBeenCalled();
  });

  it("reports when the database is not configured", async () => {
    isDbConfiguredMock.mockReturnValue(false);

    const state = await saveNote({ status: "idle" }, formData({
      scope: "user",
      owner: "octocat",
      content: "note",
    }));

    expect(state.status).toBe("error");
    expect(state.message).toContain("database");
    expect(upsertNoteMock).not.toHaveBeenCalled();
  });

  it("reports a DatabaseNotConfiguredError thrown during write", async () => {
    upsertNoteMock.mockRejectedValueOnce(new DatabaseNotConfiguredError());

    const state = await saveNote({ status: "idle" }, formData({
      scope: "user",
      owner: "octocat",
      content: "note",
    }));

    expect(state.status).toBe("error");
    expect(state.message).toContain("database");
  });
});
