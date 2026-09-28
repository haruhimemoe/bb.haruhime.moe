/**
 * @file tests/components/editor/DraftsBar.test.tsx
 * @desc Named drafts in the editor: a new draft opens empty, a rename sticks (Escape cancels),
 *       switching shows the other draft's text, and deleting (after the confirm) opens the most
 *       recent draft left, or a fresh one when it was the last.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Editor } from "@/components/editor/Editor";
import { DRAFTS_KEY } from "@/constants/editor";
import { editorText, findEditor } from "../../helpers/editor";

const STORE = {
  activeId: "d-one",
  drafts: [
    { id: "d-one", name: "Userpage", text: "[b]one[/b]", updatedAt: 2 },
    { id: "d-two", name: "Forum post", text: "two", updatedAt: 1 },
  ],
};

const stored = () => JSON.parse(window.localStorage.getItem(DRAFTS_KEY) ?? "null");

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(STORE));
});

describe("drafts", () => {
  it("switches between drafts", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    expect(editorText(await findEditor())).toBe("[b]one[/b]");
    await user.selectOptions(screen.getByLabelText("Draft"), "Forum post");
    await waitFor(async () => expect(editorText(await findEditor())).toBe("two"));
    await waitFor(() => expect(stored().activeId).toBe("d-two"));
  });

  it("keeps a draft another tab added when this one saves", async () => {
    render(<Editor />);
    const view = await findEditor();
    const fromOtherTab = {
      activeId: "d-new",
      drafts: [{ id: "d-new", name: "From template", text: "tpl", updatedAt: 9 }, ...STORE.drafts],
    };
    const newValue = JSON.stringify(fromOtherTab);
    window.localStorage.setItem(DRAFTS_KEY, newValue);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: DRAFTS_KEY, newValue }));
    });
    act(() => view.dispatch({ changes: { from: 0, insert: "!" } }));
    type Row = { id: string; text: string };
    await waitFor(() => expect(stored().activeId).toBe("d-one"));
    expect(stored().drafts.find((d: Row) => d.id === "d-one").text).toBe("![b]one[/b]");
    expect(stored().drafts.map((d: Row) => d.id)).toContain("d-new");
    expect(screen.getByRole("option", { name: "From template" })).toBeInTheDocument();
  });

  it("says which draft a new one replaces once there are 50", async () => {
    const drafts = Array.from({ length: 50 }, (_, i) => ({
      id: `d-${i}`,
      name: `Draft ${i}`,
      text: "",
      updatedAt: i + 10,
    }));
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify({ activeId: "d-3", drafts }));
    render(<Editor />);
    await findEditor();
    expect(
      screen.getByText('You have 50 drafts: a new one replaces the oldest, "Draft 0".'),
    ).toBeInTheDocument();
  });

  it("creates an empty draft with the next free name", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await findEditor();
    await user.click(screen.getByRole("button", { name: "New draft" }));
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("Draft 3");
    await waitFor(async () => expect(editorText(await findEditor())).toBe(""));
    await waitFor(() => expect(stored().drafts).toHaveLength(3));
  });

  it("renames the open draft, and Escape cancels a rename", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await findEditor();
    await user.click(screen.getByRole("button", { name: "Rename" }));
    const name = screen.getByLabelText("Draft name");
    await user.clear(name);
    await user.type(name, "  My   page {Enter}");
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("My page");
    await user.click(screen.getByRole("button", { name: "Rename" }));
    await user.type(screen.getByLabelText("Draft name"), "nope{Escape}");
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("My page");
    await waitFor(() => expect(stored().drafts[0].name).toBe("My page"));
  });

  it("deletes after the confirm and opens what's left", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await findEditor();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("Forum post");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("Draft 1");
    await waitFor(() => expect(stored().drafts).toHaveLength(1));
  });

  it("starts over when what's stored isn't a drafts list", async () => {
    window.localStorage.setItem(DRAFTS_KEY, "{not json");
    render(<Editor />);
    expect(editorText(await findEditor())).toBe("");
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("Draft 1");
  });
});
