/**
 * @file tests/components/editor/EditorShell.test.tsx
 * @desc The editor shell: it opens the saved draft, or a template's hand-off (which it takes
 *       once and saves as the draft), saves as you type, counts characters against osu!'s
 *       limit, and keeps working when the browser won't store anything.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorShell } from "@/components/editor/EditorShell";
import { DRAFT_KEY, HANDOFF_KEY } from "@/constants/editor";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EditorShell", () => {
  it("opens the saved draft and saves what's typed", async () => {
    window.localStorage.setItem(DRAFT_KEY, "[b]old[/b]");
    const user = userEvent.setup();
    render(<EditorShell />);
    const source = screen.getByLabelText("BBCode");
    await waitFor(() => expect(source).toHaveValue("[b]old[/b]"));
    await user.type(source, "!");
    await waitFor(() => expect(window.localStorage.getItem(DRAFT_KEY)).toBe("[b]old[/b]!"));
    expect(screen.getByText("11 / 60,000 characters")).toBeInTheDocument();
  });

  it("takes a template's hand-off once and keeps it as the draft", async () => {
    window.localStorage.setItem(DRAFT_KEY, "old");
    window.localStorage.setItem(HANDOFF_KEY, "from template");
    render(<EditorShell />);
    await waitFor(() => expect(screen.getByLabelText("BBCode")).toHaveValue("from template"));
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBeNull();
    expect(window.localStorage.getItem(DRAFT_KEY)).toBe("from template");
    expect(screen.getByText(/The template's text is in the editor/)).toBeInTheDocument();
  });

  it("says so when the browser won't save drafts", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    render(<EditorShell />);
    expect(await screen.findByText("This browser isn't saving drafts.")).toBeInTheDocument();
  });
});
