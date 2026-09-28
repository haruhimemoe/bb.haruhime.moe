/**
 * @file tests/unit/utils/tag-match.test.ts
 * @desc The tag pair under the cursor: both tags of the innermost pair it touches, the opening
 *       tag alone for a list item without a close, nothing inside text or on tags osu! ignores.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { parse } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { matchingTags } from "@/utils/tag-match";

const at = (text: string, pos: number) => matchingTags(parse(text).children, pos);

describe("matchingTags", () => {
  const text = "[b]a [i]b[/i][/b]";

  it("returns both tags of the pair the cursor touches", () => {
    expect(at(text, 1)).toEqual([
      { from: 0, to: 3 },
      { from: 13, to: 17 },
    ]);
    expect(at(text, 15)).toEqual([
      { from: 0, to: 3 },
      { from: 13, to: 17 },
    ]);
    expect(at(text, 6)).toEqual([
      { from: 5, to: 8 },
      { from: 9, to: 13 },
    ]);
  });

  it("finds nothing inside text, and nothing on tags osu! shows as text", () => {
    expect(at(text, 4)).toEqual([]);
    expect(at("[center]x[/center]", 2)).toEqual([]);
  });

  it("marks just the opening of a list item with no close", () => {
    expect(at("[list]\n[*]one\n[/list]", 8)).toEqual([{ from: 7, to: 10 }]);
  });
});
