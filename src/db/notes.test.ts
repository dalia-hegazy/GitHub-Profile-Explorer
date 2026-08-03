import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatabaseNotConfiguredError, getNote, listNotes, upsertNote } from "./notes";
import type { Database } from "./client";
import type { Note } from "./schema";

interface Condition {
  col: string;
  value?: unknown;
  isNull?: boolean;
}

const { getDbMock, fakeDb, resetStore, seedStore, getStore } = vi.hoisted(() => {
  let store: Note[] = [];

  function columnName(col: unknown): string {
    if (typeof col === "string") return col;
    return (col as { name?: string })?.name ?? String(col);
  }

  function matchWhere(rows: Note[], conditions: Condition[]): Note[] {
    return rows.filter((row) =>
      conditions.every((c) => {
        const key = columnName(c.col) as keyof Note;
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
          limit: (n: number) => Promise.resolve(matchWhere(store, conditions).slice(0, n)),
        }),
        orderBy: () => ({
          limit: (n: number) => Promise.resolve([...store].slice(0, n)),
        }),
      }),
    }),
    insert: () => ({
      values: (input: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
        const note: Note = {
          ...input,
          id: "new-id",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };
        store = [note, ...store];
        return { returning: () => Promise.resolve([note]) };
      },
    }),
    update: () => ({
      set: (set: Partial<Note>) => ({
        where: (idCond: Condition) => {
          const target = store.find((n) => n.id === idCond.value);
          if (!target) return { returning: () => Promise.resolve([]) };
          const updated: Note = {
            ...target,
            ...set,
            updatedAt: new Date("2024-01-02T00:00:00Z"),
          };
          store = store.map((n) => (n.id === target.id ? updated : n));
          return { returning: () => Promise.resolve([updated]) };
        },
      }),
    }),
  };

  const getDbMock = vi.fn<() => Database | null>(() => fakeDb as unknown as Database);

  return {
    getDbMock,
    fakeDb,
    resetStore: () => {
      store = [];
    },
    seedStore: (rows: Note[]) => {
      store = [...rows];
    },
    getStore: () => store,
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
    isNull: (col: string): Condition => ({ col, isNull: true }),
    desc: (col: string) => ({ col, desc: true }),
  };
});

function makeNote(overrides: Partial<Note> = {}): Note {
  const now = new Date("2024-01-01T00:00:00Z");
  return {
    id: "existing-id",
    scope: "repo",
    owner: "octocat",
    repo: "hello-world",
    content: "Original",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("notes repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    getDbMock.mockImplementation(() => fakeDb as unknown as Database);
  });

  it("returns null when the database is not configured", async () => {
    getDbMock.mockReturnValueOnce(null);

    const note = await getNote("user", "octocat", null);
    expect(note).toBeNull();
  });

  it("throws when writing without a database", async () => {
    getDbMock.mockReturnValueOnce(null);

    await expect(upsertNote("user", "octocat", null, "hi")).rejects.toBeInstanceOf(
      DatabaseNotConfiguredError,
    );
  });

  it("creates a new note when none exists", async () => {
    const note = await upsertNote("user", "octocat", null, "Remember this");
    expect(note.id).toBe("new-id");
    expect(note.content).toBe("Remember this");
    expect(note.scope).toBe("user");
  });

  it("updates an existing note", async () => {
    seedStore([makeNote()]);
    const updated = await upsertNote("repo", "octocat", "hello-world", "updated");
    expect(updated.content).toBe("updated");
    expect(updated.updatedAt.toISOString()).toBe("2024-01-02T00:00:00.000Z");
    expect(getStore()).toHaveLength(1);
  });

  it("lists notes when the database is available", async () => {
    seedStore([makeNote()]);
    const rows = await listNotes();
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe("Original");
  });
});
