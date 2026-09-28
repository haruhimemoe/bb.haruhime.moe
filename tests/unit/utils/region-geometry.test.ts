/**
 * @file tests/unit/utils/region-geometry.test.ts
 * @desc The collab maker's region math: pixels to percent, clamping, rounding, drawing, moving,
 *       resizing by each handle and keyboard nudges.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import {
  fitRect,
  isBigEnough,
  MIN_SIDE,
  moveRect,
  nudgeRect,
  pointIn,
  rectFromPoints,
  resizeRect,
  roundPercent,
  toPercent,
  toPixels,
} from "@/utils/region-geometry";

const BOX = { left: 100, top: 50, width: 400, height: 200 };
const RECT = { x: 10, y: 20, w: 30, h: 40 };

describe("pixels and percent", () => {
  it("turns pixels into percent of the image, clamped, and back", () => {
    expect(toPercent(100, 400)).toBe(25);
    expect(toPercent(-5, 400)).toBe(0);
    expect(toPercent(900, 400)).toBe(100);
    expect(toPercent(10, 0)).toBe(0);
    expect(toPixels(25, 400)).toBe(100);
  });

  it("reads a pointer against where the image sits", () => {
    expect(pointIn(200, 100, BOX)).toEqual({ x: 25, y: 25 });
    expect(pointIn(0, 400, BOX)).toEqual({ x: 0, y: 100 });
  });

  it("rounds to 2 decimals", () => {
    expect(roundPercent(33.33333)).toBe(33.33);
    expect(roundPercent(12.345)).toBeCloseTo(12.35, 2);
    expect(roundPercent(100 / 3)).toBe(33.33);
  });
});

describe("fitRect", () => {
  it("keeps a box inside the image and at least MIN_SIDE a side", () => {
    expect(fitRect({ x: 95, y: -3, w: 20, h: 0.2 })).toEqual({ x: 80, y: 0, w: 20, h: MIN_SIDE });
    expect(fitRect({ x: 0, y: 0, w: 150, h: 100 })).toEqual({ x: 0, y: 0, w: 100, h: 100 });
    expect(fitRect({ x: 1.23456, y: 2, w: 3.33333, h: 4 })).toEqual({
      x: 1.23,
      y: 2,
      w: 3.33,
      h: 4,
    });
  });
});

describe("drawing", () => {
  it("makes a box from two points in any direction", () => {
    expect(rectFromPoints({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(RECT);
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(RECT);
  });

  it("counts a drag under MIN_SIDE as a click", () => {
    expect(isBigEnough(rectFromPoints({ x: 10, y: 10 }, { x: 10.5, y: 30 }))).toBe(false);
    expect(isBigEnough(RECT)).toBe(true);
  });
});

describe("moving and resizing", () => {
  it("moves a box, stopping at the image's edges", () => {
    expect(moveRect(RECT, 5, -5)).toEqual({ x: 15, y: 15, w: 30, h: 40 });
    expect(moveRect(RECT, 100, 100)).toEqual({ x: 70, y: 60, w: 30, h: 40 });
    expect(moveRect(RECT, -50, -50)).toEqual({ x: 0, y: 0, w: 30, h: 40 });
  });

  it("moves only the edges each handle holds", () => {
    expect(resizeRect(RECT, "se", { x: 50, y: 70 })).toEqual({ x: 10, y: 20, w: 40, h: 50 });
    expect(resizeRect(RECT, "nw", { x: 5, y: 10 })).toEqual({ x: 5, y: 10, w: 35, h: 50 });
    expect(resizeRect(RECT, "n", { x: 99, y: 30 })).toEqual({ x: 10, y: 30, w: 30, h: 30 });
    expect(resizeRect(RECT, "e", { x: 20, y: 99 })).toEqual({ x: 10, y: 20, w: 10, h: 40 });
    expect(resizeRect(RECT, "sw", { x: 0, y: 100 })).toEqual({ x: 0, y: 20, w: 40, h: 80 });
  });

  it("never flips a box or lets it leave the image", () => {
    expect(resizeRect(RECT, "e", { x: 0, y: 0 })).toEqual({ x: 10, y: 20, w: MIN_SIDE, h: 40 });
    expect(resizeRect(RECT, "w", { x: 90, y: 0 })).toEqual({ x: 39, y: 20, w: MIN_SIDE, h: 40 });
    expect(resizeRect(RECT, "s", { x: 0, y: 140 })).toEqual({ x: 10, y: 20, w: 30, h: 80 });
  });
});

describe("nudgeRect", () => {
  it("moves by a small step, or a large one with Shift", () => {
    const plain = { large: false, resize: false };
    expect(nudgeRect(RECT, "ArrowRight", plain)).toEqual({ ...RECT, x: 10.5 });
    expect(nudgeRect(RECT, "ArrowUp", { large: true, resize: false })).toEqual({ ...RECT, y: 15 });
    expect(nudgeRect({ ...RECT, x: 0 }, "ArrowLeft", plain)).toEqual({ ...RECT, x: 0 });
  });

  it("grows or shrinks from the bottom-right corner with Alt", () => {
    expect(nudgeRect(RECT, "ArrowRight", { large: false, resize: true })).toEqual({
      ...RECT,
      w: 30.5,
    });
    expect(nudgeRect(RECT, "ArrowUp", { large: true, resize: true })).toEqual({ ...RECT, h: 35 });
  });

  it("ignores other keys", () => {
    expect(nudgeRect(RECT, "Enter", { large: false, resize: false })).toBeNull();
  });
});
