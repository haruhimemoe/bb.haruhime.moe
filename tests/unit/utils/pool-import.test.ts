/**
 * @file tests/unit/utils/pool-import.test.ts
 * @desc Pool import's pure half: reading ids and links (built, past, junk), grouping slots by
 *       bucket with their mods, and the mappool BBCode in boxes or headings.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import type { PoolImport } from "@/schemas/pool-import";
import { poolBbcode, poolGroups, slotLine } from "@/utils/pool-import";
import { POOL_REF_MESSAGES, parsePoolRef } from "@/utils/pool-ref";

describe("parsePoolRef", () => {
  it.each([
    "b-abcd1234",
    " B-ABCD1234 ",
    "https://pools.haruhime.moe/pools/b-abcd1234",
    "pools.haruhime.moe/pools/b-abcd1234/edit?tab=maps#x",
    "http://localhost:3000/pools/b-abcd1234",
  ])("reads %s", (input) => {
    expect(parsePoolRef(input)).toEqual({ ok: true, id: "b-abcd1234" });
  });

  it("names past pools", () => {
    for (const input of ["owc-2024-qf", "https://pools.haruhime.moe/pools/owc2024"]) {
      expect(parsePoolRef(input)).toEqual({
        ok: false,
        reason: "past",
        message: POOL_REF_MESSAGES.past,
      });
    }
  });

  it("refuses junk", () => {
    for (const input of ["", "hello", "b-abc", "b-1bcd1234", "../admin", "https://x/pools/%2F"]) {
      expect(parsePoolRef(input)).toMatchObject({ ok: false, reason: "invalid" });
    }
  });
});

describe("poolGroups", () => {
  it("groups slots by bucket in the pool's order, with forced mods only", () => {
    const groups = poolGroups({
      id: "b-abcd1234",
      name: "x",
      buckets: [{ code: "TB" }, { code: "HD" }, { code: "RC", color: 1, mods: { kind: "free" } }],
      slots: [
        { mod: "HD", index: 2, beatmapId: 2 },
        { mod: null, index: 1, beatmapId: 9 },
        { mod: "HD", index: 1, beatmapId: 1 },
        { mod: "TB", index: 1, beatmapId: 3 },
      ],
    });
    expect(groups.map((g) => [g.code, g.mods, g.slots.map((s) => s.beatmapId)])).toEqual([
      ["TB", [], [3]],
      ["HD", ["HD"], [1, 2]],
      [null, [], [9]],
    ]);
  });
});

const POOL: PoolImport = {
  id: "b-abcd1234",
  name: "Cup [b]1[/b]",
  url: "https://pools.haruhime.moe/pools/b-abcd1234",
  complete: false,
  buckets: [
    {
      code: "NM",
      mods: "",
      slots: [
        {
          label: "NM1",
          beatmapId: 100,
          map: { artist: "A", title: "T", version: "Hard", creator: "M" },
          stars: 5.456,
        },
        { label: "NM2", beatmapId: 101, map: null, stars: null },
      ],
    },
  ],
};

describe("poolBbcode", () => {
  it("writes one line per slot, stars to 2 decimals", () => {
    expect(slotLine(POOL.buckets[0]?.slots[0] as never)).toBe(
      "[b]NM1[/b] [url=https://osu.ppy.sh/b/100]A - T [Hard][/url] 5.46★ by M",
    );
    expect(slotLine(POOL.buckets[0]?.slots[1] as never)).toBe(
      "[b]NM2[/b] [url=https://osu.ppy.sh/b/101]Beatmap 101[/url] ?★",
    );
  });

  it("puts each bucket in a box, or under a bold heading, after the pool's name", () => {
    const boxes = poolBbcode(POOL, "boxes");
    expect(boxes.startsWith("[heading]Cup ")).toBe(true);
    expect(boxes).not.toContain("[b]1[/b]");
    expect(boxes).toContain("\n\n[box=NM]\n[b]NM1[/b]");
    expect(boxes.endsWith("[/box]")).toBe(true);
    const headings = poolBbcode(
      { ...POOL, buckets: [{ ...POOL.buckets[0], code: null } as never] },
      "headings",
    );
    expect(headings).toContain("\n\n[b]Other maps[/b]\n[b]NM1[/b]");
  });
});
