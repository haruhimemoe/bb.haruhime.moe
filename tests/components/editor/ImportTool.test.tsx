/**
 * @file tests/components/editor/ImportTool.test.tsx
 * @desc The Import tool against msw's /api/osu/import: a ref is checked first, a fetched post
 *       shows its title, count and preview, Insert and Replace all (asking only over text) send
 *       their edits, and the route's errors and a bad answer are shown without touching the text.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http, type JsonBodyType } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ImportTool } from "@/components/editor/ImportTool";
import { Toolbar } from "@/components/editor/Toolbar";
import { insert, replaceAll } from "@/utils/text-edit";

const server = setupMsw();
const FOUND = {
  source: {
    kind: "post",
    title: "Cup 2026",
    url: "https://osu.ppy.sh/community/forums/topics/1?start=2",
  },
  bbcode: "[b]Welcome[/b]",
};
let asked: string | null = null;

const answer = (body: JsonBodyType, status = 200) =>
  server.use(
    http.get("*/api/osu/import", ({ request }) => {
      asked = new URL(request.url).searchParams.get("ref");
      return HttpResponse.json(body, { status });
    }),
  );

const setup = async (input: string, doc = "") => {
  asked = null;
  const user = userEvent.setup();
  const onEdit = vi.fn();
  render(<ImportTool onEdit={onEdit} document={() => doc} />);
  await user.type(screen.getByLabelText("Forum link, profile link or username"), input);
  await user.click(screen.getByRole("button", { name: "Fetch" }));
  return { user, onEdit };
};

describe("ImportTool", () => {
  it("renders its panel as a surface", () => {
    render(<ImportTool onEdit={vi.fn()} document={() => ""} />);
    expect(screen.getByRole("form", { name: "Import" })).toHaveClass("bg-b4");
    expect(screen.getByRole("button", { name: "Fetch" })).toBeDisabled();
  });

  it("fetches a post and inserts it", async () => {
    answer(FOUND);
    const { user, onEdit } = await setup("https://osu.ppy.sh/community/forums/topics/1?start=2");
    expect(await screen.findByRole("link", { name: "Cup 2026" })).toHaveAttribute(
      "href",
      FOUND.source.url,
    );
    expect(asked).toBe("https://osu.ppy.sh/community/forums/topics/1?start=2");
    expect(screen.getByText("14 characters")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Insert" }));
    expect(onEdit).toHaveBeenCalledWith(insert("[b]Welcome[/b]"));
  });

  it("replaces an empty document without asking", async () => {
    answer(FOUND);
    const { user, onEdit } = await setup("peppy");
    await user.click(await screen.findByRole("button", { name: "Replace all" }));
    expect(onEdit).toHaveBeenCalledWith(replaceAll("[b]Welcome[/b]"));
  });

  it("asks before replacing text", async () => {
    answer(FOUND);
    const { user, onEdit } = await setup("peppy", "[i]mine[/i]");
    await user.click(await screen.findByRole("button", { name: "Replace all" }));
    expect(screen.getByText("Replace the whole post?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onEdit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Replace all" }));
    await user.click(screen.getByRole("button", { name: "Replace" }));
    expect(onEdit).toHaveBeenCalledWith(replaceAll("[b]Welcome[/b]"));
  });

  it("refuses junk without asking bb", async () => {
    answer(FOUND);
    await setup("not a ref!");
    expect(
      await screen.findByText(
        "Paste an osu! forum link, a profile link, a username, or @ and an id.",
      ),
    ).toBeInTheDocument();
    expect(asked).toBeNull();
  });

  it("shows the route's message and touches nothing", async () => {
    answer({ error: { message: "osu! has no post or userpage there, or it's empty." } }, 404);
    const { onEdit } = await setup("nobody_here");
    expect(
      await screen.findByText("osu! has no post or userpage there, or it's empty."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Insert" })).toBeNull();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("says when the answer isn't readable", async () => {
    answer({ nope: true });
    await setup("peppy");
    expect(await screen.findByText("The answer wasn't readable. Try again.")).toBeInTheDocument();
  });

  it("says when bb can't be reached", async () => {
    server.use(http.get("*/api/osu/import", () => HttpResponse.error()));
    await setup("peppy");
    expect(
      await screen.findByText("Couldn't reach bb. Check your connection and try again."),
    ).toBeInTheDocument();
  });

  it("opens from the toolbar's Import button", async () => {
    const user = userEvent.setup();
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} document={() => ""} onMarks={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(screen.getByRole("form", { name: "Import" })).toBeVisible();
  });
});
