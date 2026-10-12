/**
 * @file tests/unit/utils/emoji-search.test.ts
 * @desc Emoji search: every typed word starts one of an emoji's words, case doesn't matter,
 *       each emoji once, in list order; and the list itself has no repeats.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { EMOJI } from "@/constants/emoji";
import { searchEmoji } from "@/utils/emoji-search";

describe("searchEmoji", () => {
  it("matches the start of any word, ignoring case", () => {
    expect(searchEmoji("SUSH").map(([emoji]) => emoji)).toEqual(["🍣"]);
    expect(searchEmoji("heart broken").map(([emoji]) => emoji)).toEqual(["💔"]);
  });

  it("finds nothing for blank or unknown text", () => {
    expect(searchEmoji("  ")).toEqual([]);
    expect(searchEmoji("zzqx")).toEqual([]);
  });

  it("names every emoji differently, so each button has its own label", () => {
    const names = Object.values(EMOJI).flatMap((group) => group.map(([, words]) => words));
    expect(new Set(names).size).toBe(names.length);
  });

  it("lists each emoji once in the whole list", () => {
    const all = Object.values(EMOJI).flatMap((group) => group.map(([emoji]) => emoji));
    expect(new Set(all).size).toBe(all.length);
  });
});
