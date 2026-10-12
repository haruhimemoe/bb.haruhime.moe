/**
 * @file tests/unit/utils/forum-patterns.test.ts
 * @desc Mining forum posts for patterns: tag use per post, parent > child pairs, size and color
 *       values, common box titles only past the threshold, layout shares; never the posts'
 *       text.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { EMPTY_PATTERNS, minePatterns, tagBoost, tagOrder } from "@/utils/forum-patterns";
import committed from "../../../content/patterns/forum.json";

const POSTS = [
  "[centre][size=150][b]My Cup[/b][/size][/centre]\n[box=Rules][list][*]be nice[/list][/box]",
  "[notice]hi[/notice][box=Rules]x[/box][color=#ff0000]red[/color]",
  "[centre][b]Other[/b][/centre][box=Rules]y[/box][box=Secret plan]z[/box]",
];

describe("minePatterns", () => {
  const patterns = minePatterns(POSTS, { minTitle: 3 });

  it("counts posts and tag use", () => {
    expect(patterns.posts).toBe(3);
    expect(patterns.tags.b).toEqual({ posts: 2, uses: 2 });
    expect(patterns.tags.box).toEqual({ posts: 3, uses: 4 });
  });

  it("counts parent > child pairs and argument values", () => {
    expect(patterns.pairs["centre>b"]).toBe(1);
    expect(patterns.pairs["centre>size"]).toBe(1);
    expect(patterns.pairs["box>list"]).toBe(1);
    expect(patterns.sizes).toEqual({ "150": 1 });
    expect(patterns.colors).toEqual({ "#ff0000": 1 });
  });

  it("keeps only box titles common enough, lowercased", () => {
    expect(patterns.boxTitles).toEqual({ rules: 3 });
  });

  it("measures how many posts open with a centred header, a notice or use a list", () => {
    expect(patterns.shares).toEqual({ centreHeader: 2 / 3, notice: 1 / 3, list: 1 / 3 });
  });

  it("counts a box title once per post, and only sizes and colors osu! reads", () => {
    const one = minePatterns(
      ["[box=Team X]a[/box]".repeat(5), "[color=javascript:x]a[/color][size=big]b[/size]"],
      { minTitle: 3 },
    );
    expect(one.boxTitles).toEqual({});
    expect(one.colors).toEqual({});
    expect(one.sizes).toEqual({});
  });

  it("holds no post text", () => {
    const text = JSON.stringify(patterns);
    expect(text).not.toContain("be nice");
    expect(text).not.toContain("Secret plan".toLowerCase());
  });
});

describe("tagOrder", () => {
  it("orders tag names by the posts using them, unknown ones after", () => {
    const patterns = minePatterns(POSTS, { minTitle: 3 });
    expect(tagOrder(patterns, ["i", "b", "box", "notice"])).toEqual(["box", "b", "notice", "i"]);
    expect(tagOrder(EMPTY_PATTERNS, ["i", "b"])).toEqual(["i", "b"]);
  });
});

describe("tagBoost", () => {
  it("lifts tags by the share of posts using them, up to 40", () => {
    const patterns = minePatterns(POSTS, { minTitle: 3 });
    expect(tagBoost(patterns, "box")).toBe(40);
    expect(tagBoost(patterns, "b")).toBe(27);
    expect(tagBoost(patterns, "i")).toBe(0);
    expect(tagBoost(EMPTY_PATTERNS, "box")).toBe(0);
  });
});

describe("content/patterns/forum.json", () => {
  it("has the miner's shape", () => {
    const { source: _source, ...counts } = committed;
    expect(Object.keys(counts).sort()).toEqual(Object.keys(EMPTY_PATTERNS).sort());
  });
});
