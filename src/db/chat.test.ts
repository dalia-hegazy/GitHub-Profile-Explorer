import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendChatMessage, clearChatHistory, getChatHistory } from "./chat";
import { DatabaseNotConfiguredError } from "./notes";
import type { Database } from "./client";
import type { ChatMessage } from "./schema";

interface Condition {
  col: string;
  value?: unknown;
  isNull?: boolean;
}

const { getDbMock, fakeDb, resetStore, seedStore } = vi.hoisted(() => {
  let store: ChatMessage[] = [];

  function columnName(col: unknown): string {
    if (typeof col === "string") return col;
    return (col as { name?: string })?.name ?? String(col);
  }

  function matchWhere(rows: ChatMessage[], conditions: Condition[]): ChatMessage[] {
    return rows.filter((row) =>
      conditions.every((c) => {
        const key = columnName(c.col) as keyof ChatMessage;
        if (c.isNull) return row[key] == null;
        return row[key] === c.value;
      }),
    );
  }

  const fakeDb = {
    select: () => ({
      from: () => ({
        where: (conditions: Condition[]) => ({
          orderBy: () => ({
            limit: (n: number) => Promise.resolve(matchWhere(store, conditions).slice(0, n)),
          }),
        }),
      }),
    }),
    insert: () => ({
      values: (input: Omit<ChatMessage, "id" | "createdAt">) => {
        const message: ChatMessage = {
          ...input,
          id: "msg-id",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        };
        store = [...store, message];
        return { returning: () => Promise.resolve([message]) };
      },
    }),
    delete: () => ({
      where: () => {
        store = [];
        return Promise.resolve();
      },
    }),
  };

  const getDbMock = vi.fn<() => Database | null>(() => fakeDb as unknown as Database);

  return {
    getDbMock,
    fakeDb,
    resetStore: () => {
      store = [];
    },
    seedStore: (rows: ChatMessage[]) => {
      store = [...rows];
    },
  };
});

vi.mock("./client", () => ({
  getDb: getDbMock,
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: (...args: Condition[]) => args,
    eq: (col: string, value: unknown): Condition => ({ col, value }),
    asc: (col: string) => ({ col, asc: true }),
    desc: (col: string) => ({ col, desc: true }),
  };
});

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-id",
    owner: "octocat",
    repo: "hello-world",
    role: "user",
    content: "What does this repo do?",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("chat history repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    getDbMock.mockImplementation(() => fakeDb as unknown as Database);
  });

  it("returns an empty history when no messages exist", async () => {
    const history = await getChatHistory("octocat", "hello-world");
    expect(history).toEqual([]);
  });

  it("returns an empty history when the database is not configured", async () => {
    getDbMock.mockReturnValueOnce(null);

    const history = await getChatHistory("octocat", "hello-world");
    expect(history).toEqual([]);
  });

  it("throws when appending without a database", async () => {
    getDbMock.mockReturnValueOnce(null);

    await expect(appendChatMessage("octocat", "hello-world", "user", "hi")).rejects.toBeInstanceOf(
      DatabaseNotConfiguredError,
    );
  });

  it("appends a message and returns it", async () => {
    const message = await appendChatMessage("octocat", "hello-world", "assistant", "It's a demo.");
    expect(message.role).toBe("assistant");
    expect(message.content).toBe("It's a demo.");
  });

  it("clears the history for a repo", async () => {
    seedStore([makeMessage()]);
    await clearChatHistory("octocat", "hello-world");
  });

  it("returns seeded history for a repo", async () => {
    seedStore([makeMessage()]);
    const history = await getChatHistory("octocat", "hello-world");
    expect(history).toHaveLength(1);
    expect(history[0].content).toBe("What does this repo do?");
  });
});
