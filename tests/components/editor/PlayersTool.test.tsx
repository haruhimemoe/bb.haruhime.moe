/**
 * @file tests/components/editor/PlayersTool.test.tsx
 * @desc The player list tool against msw's /api/osu/users: the inserted lines in each style,
 *       small flags by default, unknown and unchecked names reported, errors shown, the 64-line
 *       cap, and the toolbar's Players button.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http, type JsonBodyType } from "msw";
import { describe, expect, it, vi } from "vitest";
import { PlayersTool } from "@/components/editor/PlayersTool";
import { Toolbar } from "@/components/editor/Toolbar";
import { insert } from "@/utils/text-edit";

const server = setupMsw();
const PEPPY = { id: 2, username: "peppy", countryCode: "AU" };
let asked: unknown = null;

const answer = (body: JsonBodyType, status = 200) =>
  server.use(
    http.post("*/api/osu/users", async ({ request }) => {
      asked = await request.json();
      return HttpResponse.json(body, { status });
    }),
  );

const type = async (text: string) => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  render(<PlayersTool onEdit={onEdit} />);
  await user.type(screen.getByLabelText(/one per line/), text);
  return { user, onEdit };
};

describe("PlayersTool", () => {
  it("inserts a numbered list with small flags, in the order given", async () => {
    answer({ users: [PEPPY], notFound: [], unchecked: [] });
    const { user, onEdit } = await type("peppy{Enter}{Enter}");
    await user.click(screen.getByRole("button", { name: "Look up and insert" }));
    expect(asked).toEqual({ names: ["peppy"] });
    expect(onEdit).toHaveBeenCalledWith(
      insert(
        "[list=1]\n[*][img]https://assets.ppy.sh/old-flags/AU.png[/img] [profile=2]peppy[/profile]\n[/list]",
      ),
    );
    expect(await screen.findByText("Found all 1.")).toBeInTheDocument();
  });

  it("writes plain lines without flags, and names what osu! doesn't know", async () => {
    answer({ users: [PEPPY], notFound: ["ghost"], unchecked: ["late"] });
    const { user, onEdit } = await type("peppy{Enter}ghost{Enter}late");
    await user.click(screen.getByRole("radio", { name: "Plain lines" }));
    await user.click(screen.getByRole("radio", { name: "No flags" }));
    await user.click(screen.getByRole("button", { name: "Look up and insert" }));
    expect(onEdit).toHaveBeenCalledWith(insert("[profile=2]peppy[/profile]"));
    expect(await screen.findByText("ghost", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("late", { selector: "span" })).toBeInTheDocument();
  });

  it("inserts nothing when nobody is found, and shows the route's error", async () => {
    answer({ users: [], notFound: ["ghost"], unchecked: [] });
    const { user, onEdit } = await type("ghost");
    await user.click(screen.getByRole("button", { name: "Look up and insert" }));
    await screen.findByText("ghost", { selector: "span" });
    expect(onEdit).not.toHaveBeenCalled();
    answer({ error: { code: "rate_limited", message: "Slow down." } }, 429);
    await user.click(screen.getByRole("button", { name: "Look up and insert" }));
    expect(await screen.findByText("Slow down.")).toBeInTheDocument();
  });

  it("refuses more than 64 lines before asking", async () => {
    asked = null;
    const user = userEvent.setup();
    render(<PlayersTool onEdit={vi.fn()} />);
    const box = screen.getByLabelText(/one per line/);
    await user.click(box);
    await user.paste(Array.from({ length: 65 }, (_, i) => `p${i}`).join("\n"));
    await user.click(screen.getByRole("button", { name: "Look up and insert" }));
    expect(await screen.findByText(/at most 64 at a time/)).toBeInTheDocument();
    expect(asked).toBeNull();
  });

  it("opens from the toolbar's Players button", async () => {
    const user = userEvent.setup();
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} />);
    await user.click(screen.getByRole("button", { name: "Players" }));
    expect(screen.getByRole("region", { name: "Players" })).toBeInTheDocument();
  });
});
