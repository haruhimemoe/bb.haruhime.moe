/**
 * @file tests/components/editor/SnippetsTool.test.tsx
 * @desc The Snippets tool against msw's routes: lists the caller's and shared snippets, inserts
 *       one, copies one as a snippet file, saves the selection as a new private snippet, imports
 *       a snippet file, refuses one it can't read, and asks visitors to sign in to save.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { SnippetsTool } from "@/components/editor/SnippetsTool";
import { SNIPPET_FORMAT, toSnippetDoc } from "@/utils/snippet-format";
import { insert } from "@/utils/text-edit";

const server = setupMsw();

const MINE = {
  id: "t-mine0001",
  name: "My header",
  description: "",
  body: "[centre]{{title}}[/centre]",
  fields: [],
  ownerName: "me",
};
const SHARED = { ...MINE, id: "t-pub00001", name: "Divider", body: "———", ownerName: "peppy" };

const lists = (signedIn = true) =>
  server.use(
    http.get("*/api/snippets", () =>
      HttpResponse.json({ mine: signedIn ? [MINE] : [], shared: [SHARED], signedIn }),
    ),
  );

const created: unknown[] = [];
const acceptCreate = () =>
  server.use(
    http.post("*/api/templates", async ({ request }) => {
      created.push(await request.json());
      return HttpResponse.json({ template: { id: "t-new00001" } }, { status: 201 });
    }),
  );

describe("SnippetsTool", () => {
  it("lists snippets and inserts one", async () => {
    lists();
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<SnippetsTool onEdit={onEdit} selection={() => ""} document={() => ""} />);
    expect(await screen.findByText("My header")).toBeInTheDocument();
    expect(screen.getByText("by peppy")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Insert Divider" }));
    expect(onEdit).toHaveBeenCalledWith(insert("———"));
  });

  it("copies a snippet as a file", async () => {
    lists();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<SnippetsTool onEdit={vi.fn()} selection={() => ""} document={() => ""} />);
    await user.click(await screen.findByRole("button", { name: "Copy My header as a file" }));
    expect(writeText).toHaveBeenCalledWith(toSnippetDoc(MINE));
  });

  it("shows the file to copy by hand when the clipboard refuses", async () => {
    lists();
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<SnippetsTool onEdit={vi.fn()} selection={() => ""} document={() => ""} />);
    await user.click(await screen.findByRole("button", { name: "Copy My header as a file" }));
    expect(await screen.findByText(/Couldn't copy/)).toBeInTheDocument();
    expect(screen.getByLabelText("Snippet file")).toHaveValue(toSnippetDoc(MINE));
  });

  it("saves the whole draft when nothing is selected, reading the selection at save time", async () => {
    lists();
    acceptCreate();
    created.length = 0;
    let selected = "";
    const user = userEvent.setup();
    render(<SnippetsTool onEdit={vi.fn()} selection={() => selected} document={() => "all"} />);
    await user.type(await screen.findByLabelText("Name"), "Whole");
    await user.click(screen.getByRole("button", { name: "Save snippet" }));
    expect(await screen.findByText("Saved Whole.")).toBeInTheDocument();
    expect(created[0]).toMatchObject({ body: "all" });
    selected = "[i]now[/i]";
    await user.type(screen.getByLabelText("Name"), "Later");
    await user.click(screen.getByRole("button", { name: "Save snippet" }));
    expect(await screen.findByText("Saved Later.")).toBeInTheDocument();
    expect(created[1]).toMatchObject({ body: "[i]now[/i]" });
  });

  it("says when the snippets didn't load", async () => {
    server.use(http.get("*/api/snippets", () => HttpResponse.json({}, { status: 500 })));
    render(<SnippetsTool onEdit={vi.fn()} selection={() => ""} document={() => ""} />);
    expect(await screen.findByText("Snippets didn't load (500).")).toBeInTheDocument();
  });

  it("saves the selection as a private snippet", async () => {
    lists();
    acceptCreate();
    created.length = 0;
    const user = userEvent.setup();
    render(<SnippetsTool onEdit={vi.fn()} selection={() => "[b]hi[/b]"} document={() => "all"} />);
    await user.type(await screen.findByLabelText("Name"), "Bold hi");
    await user.click(screen.getByRole("button", { name: "Save snippet" }));
    expect(await screen.findByText("Saved Bold hi.")).toBeInTheDocument();
    expect(created[0]).toMatchObject({
      name: "Bold hi",
      kind: "snippet",
      body: "[b]hi[/b]",
      visibility: "private",
    });
  });

  it("imports a snippet file and refuses what it can't read", async () => {
    lists();
    acceptCreate();
    created.length = 0;
    const user = userEvent.setup();
    render(<SnippetsTool onEdit={vi.fn()} selection={() => ""} document={() => ""} />);
    const field = await screen.findByLabelText("Snippet file (haruhime.snippet/1 JSON)");
    await user.click(field);
    await user.paste("nope");
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(screen.getByText("That isn't a snippet file bb can read.")).toBeInTheDocument();
    await user.clear(field);
    await user.click(field);
    await user.paste(
      JSON.stringify({
        format: SNIPPET_FORMAT,
        language: "bbcode",
        name: "Imported one",
        body: "x",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(await screen.findByText("Imported Imported one.")).toBeInTheDocument();
    expect(created[0]).toMatchObject({ name: "Imported one", kind: "snippet", body: "x" });
  });

  it("asks a visitor to sign in to save", async () => {
    lists(false);
    render(<SnippetsTool onEdit={vi.fn()} selection={() => ""} document={() => ""} />);
    expect(await screen.findByText("Sign in to save your own snippets.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save snippet" })).not.toBeInTheDocument();
  });
});
