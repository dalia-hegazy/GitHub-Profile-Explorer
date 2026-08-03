import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NoteActionState } from "@/actions/notes";

import { NoteEditor } from "./note-editor";

type NoteAction = (prevState: NoteActionState, formData: FormData) => Promise<NoteActionState>;

const actionMock = vi.fn<NoteAction>();

function makeAction(response: NoteActionState): ReturnType<typeof vi.fn<NoteAction>> {
  return vi.fn<NoteAction>(async () => response);
}

describe("NoteEditor", () => {
  beforeEach(() => {
    actionMock.mockClear();
  });

  it("renders the note textarea and save button", () => {
    render(
      <NoteEditor action={actionMock} scope="user" owner="octocat" title="Profile notes" />,
    );

    expect(screen.getByLabelText("Profile notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save note" })).toBeInTheDocument();
  });

  it("submits scope, owner, and content", async () => {
    const user = userEvent.setup();
    const action = makeAction({ status: "success", message: "Note saved." });
    render(<NoteEditor action={action} scope="repo" owner="octocat" repo="hello-world" />);

    await user.type(screen.getByRole("textbox"), "Review the tests");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() => expect(action).toHaveBeenCalled());

    const formData = action.mock.calls[0][1];
    expect(formData.get("scope")).toBe("repo");
    expect(formData.get("owner")).toBe("octocat");
    expect(formData.get("repo")).toBe("hello-world");
    expect(formData.get("content")).toBe("Review the tests");
  });

  it("pre-fills the textarea with an existing note", () => {
    render(
      <NoteEditor
        action={actionMock}
        scope="user"
        owner="octocat"
        defaultValue="Existing note"
      />,
    );

    expect(screen.getByRole("textbox")).toHaveValue("Existing note");
  });

  it("shows a success message after saving", async () => {
    const user = userEvent.setup();
    const action = makeAction({ status: "success", message: "Note saved." });
    render(<NoteEditor action={action} scope="user" owner="octocat" />);

    await user.type(screen.getByRole("textbox"), "hi");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    expect(await screen.findByText("Note saved.")).toBeInTheDocument();
  });

  it("shows an error message when the action fails", async () => {
    const user = userEvent.setup();
    const action = makeAction({ status: "error", message: "Notes require a database." });
    render(<NoteEditor action={action} scope="user" owner="octocat" />);

    await user.type(screen.getByRole("textbox"), "hi");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Notes require a database.");
  });
});
