/**
 * @file tests/components/editor/insert-tools.test.tsx
 * @desc The toolbar's groups and the Emoji, Table and Art tools: search and insert emoji (kept as
 *       recent), lay a pasted table out in [code], and insert kaomoji, banners and pieces.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtTool } from "@/components/editor/ArtTool";
import { EmojiTool } from "@/components/editor/EmojiTool";
import { TableTool } from "@/components/editor/TableTool";
import { Toolbar } from "@/components/editor/Toolbar";
import { ART_PIECES } from "@/constants/ascii";
import { banner } from "@/utils/banner";
import { layoutTable, parseTable } from "@/utils/table";
import { insert } from "@/utils/text-edit";

const code = (lines: readonly string[]) => insert(`[code]\n${lines.join("\n")}\n[/code]`);

beforeEach(() => window.localStorage.clear());

describe("Toolbar groups", () => {
  it("groups the tools under Insert, Bring in and Editor", () => {
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} />);
    const group = (name: string) =>
      within(screen.getByRole("group", { name }))
        .getAllByRole("button")
        .map((button) => button.textContent);
    expect(group("Insert")).toEqual(["Color", "Gradient", "Flag", "Emoji", "Table", "Art"]);
    expect(group("Bring in")).toEqual(["Players", "Pool", "Import", "Markdown"]);
    expect(group("Editor")).toEqual(["Settings"]);
  });
});

describe("EmojiTool", () => {
  it("finds an emoji, inserts it, stays open and keeps it as recent", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EmojiTool onEdit={onEdit} />);
    await user.type(screen.getByLabelText("Search emoji"), "sushi");
    await user.click(screen.getByRole("button", { name: "sushi" }));
    expect(onEdit).toHaveBeenCalledWith(insert("🍣"));
    expect(screen.getByText("Inserted 🍣.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Search emoji"));
    expect(screen.getByRole("list", { name: "Recently used" })).toHaveTextContent("🍣");
  });

  it("shows a group and says when a search finds nothing", async () => {
    const user = userEvent.setup();
    render(<EmojiTool onEdit={vi.fn()} />);
    await user.click(screen.getByRole("tab", { name: "Food and drink" }));
    expect(screen.getByRole("button", { name: "sushi" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search emoji"), "zzqx");
    expect(screen.getByText("No emoji for “zzqx”.")).toBeInTheDocument();
  });
});

describe("TableTool", () => {
  it("lays pasted rows out and inserts them in [code]", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TableTool onEdit={onEdit} />);
    expect(screen.getByRole("button", { name: "Insert table" })).toBeDisabled();
    await user.click(screen.getByLabelText("Rows, one per line"));
    await user.paste("Map,Stars\nFD,7.2");
    await user.click(screen.getByRole("radio", { name: "Lines" }));
    const lines = layoutTable(parseTable("Map,Stars\nFD,7.2"), { style: "unicode", header: true });
    expect(screen.getByLabelText("Preview")).toHaveTextContent(lines[1] ?? "");
    await user.click(screen.getByRole("button", { name: "Insert table" }));
    expect(onEdit).toHaveBeenCalledWith(code(lines));
  });

  it("refuses more than 12 columns", async () => {
    const user = userEvent.setup();
    render(<TableTool onEdit={vi.fn()} />);
    await user.click(screen.getByLabelText("Rows, one per line"));
    await user.paste(Array.from({ length: 13 }, (_, i) => `c${i}`).join(","));
    expect(screen.getByText("A table can have up to 50 rows and 12 columns.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert table" })).toBeDisabled();
  });
});

describe("ArtTool", () => {
  it("inserts a kaomoji and stays open", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ArtTool onEdit={onEdit} />);
    await user.click(screen.getByRole("tab", { name: "Shrug" }));
    await user.click(screen.getByRole("button", { name: "¯\\_(ツ)_/¯" }));
    expect(onEdit).toHaveBeenCalledWith(insert("¯\\_(ツ)_/¯"));
    expect(screen.getByRole("region", { name: "Art" })).toBeInTheDocument();
  });

  it("draws a banner in [code] and names letters the font lacks", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ArtTool onEdit={onEdit} />);
    await user.click(screen.getByRole("tab", { name: "Banner" }));
    const field = screen.getByLabelText("Banner text");
    await user.type(field, "hi~");
    expect(screen.getByText("The banner font has no ~.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert banner" })).toBeDisabled();
    await user.type(field, "{Backspace}");
    await user.click(screen.getByRole("button", { name: "Insert banner" }));
    expect(onEdit).toHaveBeenCalledWith(code(banner("hi").lines));
  });

  it("inserts a piece in [code]", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ArtTool onEdit={onEdit} />);
    await user.click(screen.getByRole("tab", { name: "Pieces" }));
    await user.click(screen.getByRole("button", { name: "Insert Cat" }));
    expect(onEdit).toHaveBeenCalledWith(code([ART_PIECES[0]?.art ?? ""]));
  });
});
