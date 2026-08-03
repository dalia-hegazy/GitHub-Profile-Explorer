import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "./client";
import { notes, type NewNote, type Note, type NoteScope } from "./schema";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set; persistence is unavailable.");
    this.name = "DatabaseNotConfiguredError";
  }
}

function repoCondition(scope: NoteScope, owner: string, repo: string | null) {
  if (scope === "repo" && repo) {
    return and(eq(notes.scope, scope), eq(notes.owner, owner), eq(notes.repo, repo));
  }
  return and(eq(notes.scope, scope), eq(notes.owner, owner), isNull(notes.repo));
}

export async function getNote(
  scope: NoteScope,
  owner: string,
  repo: string | null,
): Promise<Note | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(notes).where(repoCondition(scope, owner, repo)).limit(1);
  return rows[0] ?? null;
}

export async function upsertNote(
  scope: NoteScope,
  owner: string,
  repo: string | null,
  content: string,
): Promise<Note> {
  const db = getDb();
  if (!db) throw new DatabaseNotConfiguredError();

  const existing = await getNote(scope, owner, repo);
  const input: NewNote = {
    scope,
    owner,
    repo: scope === "repo" ? repo : null,
    content,
  };

  if (existing) {
    const rows = await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, existing.id))
      .returning();
    return rows[0];
  }

  const rows = await db.insert(notes).values(input).returning();
  return rows[0];
}

export async function listNotes(): Promise<Note[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(notes).orderBy(desc(notes.updatedAt)).limit(100);
}
