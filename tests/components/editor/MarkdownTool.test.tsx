/**
 * @file tests/components/editor/MarkdownTool.test.tsx
 * @desc The Markdown tool: pasted markdown inserts as BBCode, its losses are listed, Replace all
 *       asks first only when there's text to lose, heading style reaches fromMarkdown, and Copy as
 *       markdown writes the clipboard (or falls back to a field) and marks its losses.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { fromMarkdown, toMarkdown } from "@haruhimemoe/bbcode/markdown";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownTool } from "@/components/editor/MarkdownTool";
import { Toolbar } from "@/components/editor/Toolbar";
import { insert, replaceAll } from "@/utils/text-edit";

const setup = (doc = "") => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  const onMarks = vi.fn();
  render(<MarkdownTool onEdit={onEdit} document={() => doc} onMarks={onMarks} />);
  return { user, onEdit, onMarks };
};

const field = () => screen.getByLabelText("Markdown to convert");

describe("MarkdownTool", () => {
  it("renders its panel as a surface", () => {
    setup();
    expect(screen.getByRole("form", { name: "Markdown" })).toHaveClass("bg-b4");
  });

  it("inserts pasted markdown as BBCode and clears the field", async () => {
    const { user, onEdit } = setup();
    await user.click(field());
    await user.paste("**hi** there");
    expect(await screen.findByText("Converts with nothing lost.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Insert as BBCode" }));
    expect(onEdit).toHaveBeenCalledWith(insert(fromMarkdown("**hi** there").output));
    expect(field()).toHaveValue("");
  });

  it("lists what the conversion loses", async () => {
    const { user } = setup();
    await user.click(field());
    await user.paste("## Two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(await screen.findByText("Lost in the conversion:")).toBeInTheDocument();
    expect(screen.getByText("1 table (kept as a code block)")).toBeInTheDocument();
    expect(screen.getByText("1 smaller heading (osu! has one heading size)")).toBeInTheDocument();
  });

  it("writes ## as bold text when asked", async () => {
    const { user, onEdit } = setup();
    await user.click(screen.getByRole("radio", { name: "Bold text" }));
    await user.click(field());
    await user.paste("## Two");
    await user.click(screen.getByRole("button", { name: "Insert as BBCode" }));
    expect(onEdit).toHaveBeenCalledWith(
      insert(fromMarkdown("## Two", { headingStyle: "bold" }).output),
    );
  });

  it("keeps the buttons off with nothing to convert", () => {
    setup();
    expect(screen.getByRole("button", { name: "Insert as BBCode" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace all" })).toBeDisabled();
  });

  it("replaces an empty document without asking", async () => {
    const { user, onEdit } = setup("   ");
    await user.click(field());
    await user.paste("*a*");
    await user.click(screen.getByRole("button", { name: "Replace all" }));
    expect(onEdit).toHaveBeenCalledWith(replaceAll(fromMarkdown("*a*").output));
  });

  it("asks before replacing text, and Cancel keeps it", async () => {
    const { user, onEdit } = setup("[b]keep[/b]");
    await user.click(field());
    await user.paste("*a*");
    await user.click(screen.getByRole("button", { name: "Replace all" }));
    expect(screen.getByText("Replace the whole post?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onEdit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Replace all" }));
    await user.click(screen.getByRole("button", { name: "Replace" }));
    expect(onEdit).toHaveBeenCalledWith(replaceAll(fromMarkdown("*a*").output));
  });

  it("copies the post as markdown and marks what has no markdown form", async () => {
    const doc = "[b]a[/b] [u]b[/u]";
    const { user, onMarks } = setup(doc);
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy as markdown" }));
    const { output, lost } = toMarkdown(doc);
    expect(writeText).toHaveBeenCalledWith(output);
    expect(onMarks).toHaveBeenCalledWith(lost);
    expect(
      await screen.findByText("Copied. 1 thing has no markdown form, marked in the editor."),
    ).toBeInTheDocument();
  });

  it("says plainly when nothing was lost in the copy", async () => {
    const { user } = setup("[b]a[/b]");
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy as markdown" }));
    expect(await screen.findByText("Copied as markdown.")).toBeInTheDocument();
  });

  it("shows the markdown in a field when the clipboard is refused, and still marks", async () => {
    const doc = "[u]b[/u]";
    const { user, onMarks } = setup(doc);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "Copy as markdown" }));
    expect(await screen.findByLabelText("The post as markdown")).toHaveValue(
      toMarkdown(doc).output,
    );
    expect(
      screen.getByText("Your browser blocked the clipboard. Copy it from here."),
    ).toBeVisible();
    expect(onMarks).toHaveBeenCalledWith(toMarkdown(doc).lost);
  });

  it("opens from the toolbar's Markdown button", async () => {
    const user = userEvent.setup();
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} document={() => ""} onMarks={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Markdown" }));
    expect(screen.getByRole("form", { name: "Markdown" })).toBeVisible();
  });
});
