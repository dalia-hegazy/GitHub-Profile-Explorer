import { saveNote } from "@/actions/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDbConfigured } from "@/db/client";
import { getNote } from "@/db/notes";

import { NoteEditor } from "./note-editor";

interface NoteSectionProps {
  scope: "user" | "repo";
  owner: string;
  repo?: string;
  title?: string;
}

export async function NoteSection({
  scope,
  owner,
  repo,
  title = "Notes",
}: NoteSectionProps) {
  const note = await getNote(scope, owner, repo ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <NoteEditor
          action={saveNote}
          scope={scope}
          owner={owner}
          repo={repo}
          defaultValue={note?.content ?? ""}
          description={
            isDbConfigured() ? undefined : "Set DATABASE_URL to enable persistent notes."
          }
        />
      </CardContent>
    </Card>
  );
}
