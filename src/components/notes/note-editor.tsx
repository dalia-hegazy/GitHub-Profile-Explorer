"use client";

import { useActionState } from "react";

import type { NoteActionState } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: NoteActionState = { status: "idle" };

interface NoteEditorProps {
  action: (prevState: NoteActionState, formData: FormData) => Promise<NoteActionState>;
  scope: "user" | "repo";
  owner: string;
  repo?: string;
  defaultValue?: string;
  title?: string;
  description?: string;
}

export function NoteEditor({
  action,
  scope,
  owner,
  repo,
  defaultValue = "",
  title = "Note",
  description,
}: NoteEditorProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="owner" value={owner} />
      {repo ? <input type="hidden" name="repo" value={repo} /> : null}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="note-content" className="font-medium text-sm">
            {title}
          </label>
          {description ? (
            <span className="text-xs text-muted-foreground">{description}</span>
          ) : null}
        </div>
        <Textarea
          id="note-content"
          name="content"
          defaultValue={defaultValue}
          rows={4}
          maxLength={5000}
          placeholder="Add a private note about this profile or repository…"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save note"}
          </Button>
          {state.status === "success" ? (
            <p className="text-sm text-muted-foreground" role="status">
              {state.message}
            </p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
