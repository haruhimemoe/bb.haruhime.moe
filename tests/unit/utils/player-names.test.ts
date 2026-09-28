/**
 * @file tests/unit/utils/player-names.test.ts
 * @desc The player list's text: which lines are ids, names or profile links, their cache keys,
 *       the answer in the order asked, and the BBCode in each list and flag style.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import {
  parsePlayer,
  playerAnswer,
  playerLines,
  playerListBbcode,
  queryKey,
} from "@/utils/player-names";

const PEPPY = { id: 2, username: "peppy", countryCode: "AU" };
const NOFLAG = { id: 3, username: "[Ryu] x", countryCode: null };

describe("parsePlayer", () => {
  it("reads ids, names and profile links", () => {
    expect(parsePlayer(" 2 ")).toEqual({ kind: "id", id: 2 });
    expect(parsePlayer("[Ryu] some_one-2")).toEqual({ kind: "name", name: "[Ryu] some_one-2" });
    expect(parsePlayer("https://osu.ppy.sh/users/2/osu")).toEqual({ kind: "id", id: 2 });
    expect(parsePlayer("osu.ppy.sh/u/peppy")).toEqual({ kind: "name", name: "peppy" });
    expect(parsePlayer("https://osu.ppy.sh/users/some%20one")).toEqual({
      kind: "name",
      name: "some one",
    });
  });

  it("refuses anything else", () => {
    for (const line of [
      "",
      "0",
      "99999999999",
      "bad!name",
      "x".repeat(33),
      "https://x.com/users/2",
    ]) {
      expect(parsePlayer(line)).toBeNull();
    }
  });

  it("keys ids and lower-cased names", () => {
    expect(queryKey({ kind: "id", id: 2 })).toBe("id:2");
    expect(queryKey({ kind: "name", name: "PePpy" })).toBe("name:peppy");
  });

  it("splits pasted text into trimmed lines", () => {
    expect(playerLines(" a \r\n\n b\n")).toEqual(["a", "b"]);
  });
});

describe("playerAnswer", () => {
  it("orders users as asked, once each, and sorts out the rest", () => {
    const found = new Map([
      ["name:peppy", PEPPY],
      ["id:2", PEPPY],
      ["name:ghost", null],
    ]);
    expect(playerAnswer(["peppy", "ghost", "2", "bad!", "later"], found)).toEqual({
      users: [PEPPY],
      notFound: ["ghost", "bad!"],
      unchecked: ["later"],
    });
  });
});

describe("playerListBbcode", () => {
  it("writes a numbered list with small flags", () => {
    expect(playerListBbcode([PEPPY, NOFLAG], { style: "numbered", flags: "legacy" })).toBe(
      "[list=1]\n[*][img]https://assets.ppy.sh/old-flags/AU.png[/img] [profile=2]peppy[/profile]\n[*][profile=3][Ryu] x[/profile]\n[/list]",
    );
  });

  it("writes bullets or plain lines, with SVG flags or none", () => {
    expect(playerListBbcode([PEPPY], { style: "bullets", flags: "none" })).toBe(
      "[list]\n[*][profile=2]peppy[/profile]\n[/list]",
    );
    expect(playerListBbcode([PEPPY, PEPPY], { style: "lines", flags: "modern" })).toBe(
      "[img]https://osu.ppy.sh/assets/images/flags/1f1e6-1f1fa.svg[/img] [profile=2]peppy[/profile]\n"
        .repeat(2)
        .trimEnd(),
    );
    expect(playerListBbcode([], { style: "lines", flags: "none" })).toBe("");
  });
});
