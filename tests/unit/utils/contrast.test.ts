/**
 * @file tests/unit/utils/contrast.test.ts
 * @desc WCAG contrast: hex parsing, luminance at the ends, known ratios, and the hex behind a
 *       typed value.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { colorHex, contrastRatio, hexToRgb, luminance } from "@/utils/contrast";

describe("contrast", () => {
  it("parses hex colors", () => {
    expect(hexToRgb("#ff66aa")).toEqual([255, 102, 170]);
    expect(hexToRgb("abc")).toEqual([170, 187, 204]);
    expect(hexToRgb("#12")).toBeNull();
    expect(hexToRgb("red")).toBeNull();
  });

  it("measures luminance and ratios", () => {
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#ffffff", "#000")).toBeCloseTo(21);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
    expect(contrastRatio("red", "#000")).toBeNull();
  });

  it("finds the hex behind a typed value", () => {
    expect(colorHex("#ABC")).toBe("#aabbcc");
    expect(colorHex(" Gold ")).toBe("#ffd700");
    expect(colorHex("abc")).toBeNull();
    expect(colorHex("tomato")).toBeNull();
  });
});
