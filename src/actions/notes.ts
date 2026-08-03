"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DatabaseNotConfiguredError, upsertNote } from "@/db/notes";
import { isDbConfigured } from "@/db/client";

export interface NoteActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/;
const MAX_NOTE_LENGTH = 5000;

const noteInputSchema = z.object({
  scope: z.enum(["user", "repo"]),
  owner: z
    .string()
    .min(1)
    .max(39)
    .regex(GITHUB_USERNAME_PATTERN, "Invalid username."),
  repo: z.string().min(1).max(100).optional(),
  content: z.string().trim().min(1, "Note cannot be empty.").max(MAX_NOTE_LENGTH),
});

export async function saveNote(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = noteInputSchema.safeParse({
    scope: formData.get("scope"),
    owner: formData.get("owner"),
    repo: formData.get("repo") || undefined,
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid note.";
    return { status: "error", message };
  }

  if (!isDbConfigured()) {
    return {
      status: "error",
      message: "Notes require a database to be configured.",
    };
  }

  const { scope, owner, repo, content } = parsed.data;

  try {
    await upsertNote(scope, owner, repo ?? null, content);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return { status: "error", message: "Notes require a database to be configured." };
    }
    throw error;
  }

  const path = scope === "user" ? `/u/${owner}` : `/u/${owner}/${repo}`;
  revalidatePath(path);

  return { status: "success", message: "Note saved." };
}
