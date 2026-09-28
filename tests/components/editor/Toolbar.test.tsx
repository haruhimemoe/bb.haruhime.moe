/**
 * @file tests/components/editor/Toolbar.test.tsx
 * @desc The toolbar: every button names a tag in @haruhimemoe/bbcode's TAGS and says what it does
 *       (plus its shortcut), buttons send their edit, the tools open one at a time, and a tool's
 *       result lands in the editor in place of the selection.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { findTag } from "@haruhimemoe/bbcode";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Editor } from "@/components/editor/Editor";
import { Toolbar } from "@/components/editor/Toolbar";
import { TOOLBAR_ITEMS } from "@/constants/toolbar";
import { tagDescription } from "@/utils/docs";
import { editorText, findEditor, selectRange } from "../../helpers/editor";

describe("Toolbar", () => {
  it.each(TOOLBAR_ITEMS.map((item) => [item.label, item] as const))(
    "%s writes a tag osu! knows and sends its edit",
    async (label, item) => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<Toolbar onEdit={onEdit} selection={() => ""} />);
      const button = screen.getByRole("button", { name: label });
      expect(findTag(item.tag)).toBeDefined();
      const tag = findTag(item.tag);
      expect(button.title).toContain(tag ? tagDescription(tag) : "?");
      await user.click(button);
      expect(onEdit).toHaveBeenCalledWith(item.edit);
    },
  );

  it("names the shortcuts in the tooltips", () => {
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} />);
    expect(screen.getByRole("button", { name: "Bold" }).title).toContain("(Ctrl+B or Cmd+B)");
  });

  it("opens one tool at a time", async () => {
    const user = userEvent.setup();
    render(<Toolbar onEdit={vi.fn()} selection={() => "picked"} />);
    const color = screen.getByRole("button", { name: "Color" });
    await user.click(color);
    expect(color).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Color" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gradient" }));
    expect(screen.queryByRole("region", { name: "Color" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Text")).toHaveValue("picked");
    await user.click(screen.getByRole("button", { name: "Gradient" }));
    expect(screen.queryByRole("region", { name: "Gradient" })).not.toBeInTheDocument();
  });

  it("puts a tool's result in the editor in place of the selection", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(<Editor />);
    const view = await findEditor();
    act(() => view.dispatch({ changes: { from: 0, insert: "from: here" } }));
    selectRange(view, 6, 10);
    await user.click(screen.getByRole("button", { name: "Flag" }));
    await user.type(screen.getByLabelText("Country"), "us");
    await user.click(screen.getByRole("button", { name: "United States (US)" }));
    expect(editorText(view)).toBe(
      "from: [img]https://osu.ppy.sh/assets/images/flags/1f1fa-1f1f8.svg[/img]",
    );
    expect(screen.queryByRole("region", { name: "Flag" })).not.toBeInTheDocument();
  });
});
