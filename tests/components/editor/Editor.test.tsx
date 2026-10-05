/**
 * @file tests/components/editor/Editor.test.tsx
 * @desc The editor at /: it opens the drafts (moving stage 1's draft in), turns a template's
 *       "Use" into a new draft, wraps the selection from the toolbar and the Ctrl or Cmd
 *       shortcuts, counts against the target's limit, and keeps working when the browser won't
 *       store anything.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Editor } from "@/components/editor/Editor";
import { DRAFTS_KEY, HANDOFF_KEY, LEGACY_DRAFT_KEY } from "@/constants/editor";
import { editorText, findEditor, pressInEditor, selectRange } from "../../helpers/editor";

const stored = () => JSON.parse(window.localStorage.getItem(DRAFTS_KEY) ?? "null");

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Editor", () => {
  it("shows the empty preview as a rounded, filled empty state", () => {
    render(<Editor />);
    const box = screen.getByText(/The preview shows here as you type/);
    expect(box).toHaveClass("rounded-[10px]", "bg-b4", "min-h-[24rem]");
  });

  it("moves stage 1's draft in and saves what's typed", async () => {
    window.localStorage.setItem(LEGACY_DRAFT_KEY, "[b]old[/b]");
    render(<Editor />);
    const view = await findEditor();
    expect(editorText(view)).toBe("[b]old[/b]");
    expect(window.localStorage.getItem(LEGACY_DRAFT_KEY)).toBeNull();
    expect(screen.getByLabelText("Draft")).toHaveDisplayValue("My draft");
    act(() => view.dispatch({ changes: { from: 10, insert: "!" } }));
    await waitFor(() => expect(stored().drafts[0].text).toBe("[b]old[/b]!"));
    expect(screen.getByText("11 / 60,000 characters")).toBeInTheDocument();
    expect(screen.getByText("old").tagName).toBe("STRONG");
  });

  it("opens a template's hand-off as a new draft and takes it once", async () => {
    window.localStorage.setItem(LEGACY_DRAFT_KEY, "mine");
    window.localStorage.setItem(HANDOFF_KEY, "from template");
    render(<Editor />);
    const view = await findEditor();
    expect(editorText(view)).toBe("from template");
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBeNull();
    expect(screen.getByText(/open as a new draft, "From a template"/)).toBeInTheDocument();
    expect(stored().drafts.map((draft: { text: string }) => draft.text)).toEqual([
      "from template",
      "mine",
    ]);
  });

  it("wraps the selection from the toolbar, and unwraps it again", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    const view = await findEditor();
    act(() => view.dispatch({ changes: { from: 0, insert: "hello world" } }));
    selectRange(view, 0, 5);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editorText(view)).toBe("[b]hello[/b] world");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editorText(view)).toBe("hello world");
    await user.selectOptions(screen.getByLabelText("Size"), "150");
    expect(editorText(view)).toBe("[size=150]hello[/size] world");
  });

  it("puts a placeholder in when nothing is selected", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    const view = await findEditor();
    await user.click(screen.getByRole("button", { name: "Box" }));
    expect(editorText(view)).toBe("[box=Title]\nInside the box\n[/box]");
  });

  it.each([
    ["b", "[b]hi[/b]"],
    ["i", "[i]hi[/i]"],
    ["u", "[u]hi[/u]"],
  ])("wraps with Ctrl+%s", async (key, expected) => {
    render(<Editor />);
    const view = await findEditor();
    act(() => view.dispatch({ changes: { from: 0, insert: "hi" } }));
    selectRange(view, 0, 2);
    act(() => pressInEditor(view, key, { ctrlKey: true }));
    expect(editorText(view)).toBe(expected);
  });

  it("says so when the browser won't save drafts", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    render(<Editor />);
    expect(await screen.findByText("This browser isn't saving drafts.")).toBeInTheDocument();
  });
});
