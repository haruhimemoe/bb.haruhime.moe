/**
 * @file tests/unit/utils/banner.test.ts
 * @desc Banner text in the block font: five rows, letters one column apart, lowercase drawn as
 *       capitals, and characters the font lacks listed instead of drawn.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { BANNER_FONT } from "@/constants/ascii";
import { banner } from "@/utils/banner";

describe("banner", () => {
  it("draws each letter in five rows, one column apart", () => {
    expect(banner("hi").lines).toEqual([
      "█   █ ███",
      "█   █  █",
      "█████  █",
      "█   █  █",
      "█   █ ███",
    ]);
  });

  it("lists characters the font lacks", () => {
    expect(banner("a~b~é")).toEqual({ lines: [], missing: ["~", "é"] });
  });

  it("is empty for empty text", () => {
    expect(banner("  ")).toEqual({ lines: [], missing: [] });
  });

  it("has every glyph five rows high", () => {
    for (const [char, rows] of Object.entries(BANNER_FONT)) {
      expect(rows, char).toHaveLength(5);
    }
  });
});
