/**
 * @file tests/components/editor/PoolTool.test.tsx
 * @desc The pool import tool against msw's /api/pools/<id>: a link becomes an id, the section
 *       is inserted in boxes or headings, an incomplete answer says so, past pools and the
 *       route's errors are shown, and the toolbar's Pool button opens it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http, type JsonBodyType } from "msw";
import { describe, expect, it, vi } from "vitest";
import { PoolTool } from "@/components/editor/PoolTool";
import { Toolbar } from "@/components/editor/Toolbar";
import type { PoolImport } from "@/schemas/pool-import";
import { poolBbcode } from "@/utils/pool-import";
import { insert } from "@/utils/text-edit";

const server = setupMsw();
const POOL: PoolImport = {
  id: "b-abcd1234",
  name: "Cup",
  url: "https://pools.haruhime.moe/pools/b-abcd1234",
  complete: true,
  buckets: [
    {
      code: "HR",
      mods: "HR",
      slots: [
        {
          label: "HR1",
          beatmapId: 1,
          map: { artist: "A", title: "T", version: "V", creator: "M" },
          stars: 6,
        },
      ],
    },
  ],
};
let asked = "";

const answer = (body: JsonBodyType, status = 200) =>
  server.use(
    http.get("*/api/pools/:id", ({ params }) => {
      asked = String(params.id);
      return HttpResponse.json(body, { status });
    }),
  );

const setup = async (input: string) => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  render(<PoolTool onEdit={onEdit} />);
  await user.type(screen.getByLabelText("Pool id or link"), input);
  return { user, onEdit };
};

describe("PoolTool", () => {
  it("imports a pool from its link, in boxes by default", async () => {
    answer({ pool: POOL });
    const { user, onEdit } = await setup("https://pools.haruhime.moe/pools/b-abcd1234");
    await user.click(screen.getByRole("button", { name: "Import pool" }));
    expect(await screen.findByText("Inserted Cup.")).toBeInTheDocument();
    expect(asked).toBe("b-abcd1234");
    expect(onEdit).toHaveBeenCalledWith(insert(poolBbcode(POOL, "boxes")));
  });

  it("writes headings when asked and says when some stars are missing", async () => {
    answer({ pool: { ...POOL, complete: false } });
    const { user, onEdit } = await setup("b-abcd1234");
    await user.click(screen.getByRole("radio", { name: "Plain headings" }));
    await user.click(screen.getByRole("button", { name: "Import pool" }));
    expect(await screen.findByText(/couldn't be looked up/)).toBeInTheDocument();
    expect(onEdit).toHaveBeenCalledWith(insert(poolBbcode(POOL, "headings")));
  });

  it("refuses a past pool without asking, and shows the route's errors", async () => {
    asked = "";
    const { user, onEdit } = await setup("owc-2024-qf");
    await user.click(screen.getByRole("button", { name: "Import pool" }));
    expect(screen.getByText(/That's a past pool/)).toBeInTheDocument();
    expect(asked).toBe("");
    answer({ error: { code: "not_found", message: "It may be private or gone." } }, 404);
    await user.clear(screen.getByLabelText("Pool id or link"));
    await user.type(screen.getByLabelText("Pool id or link"), "b-zzzz9999");
    await user.click(screen.getByRole("button", { name: "Import pool" }));
    expect(await screen.findByText("It may be private or gone.")).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("opens from the toolbar's Pool button", async () => {
    const user = userEvent.setup();
    render(<Toolbar onEdit={vi.fn()} selection={() => ""} />);
    await user.click(screen.getByRole("button", { name: "Pool" }));
    expect(screen.getByRole("form", { name: "Pool" })).toBeInTheDocument();
  });
});
