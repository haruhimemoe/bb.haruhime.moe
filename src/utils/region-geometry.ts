/**
 * @file src/utils/region-geometry.ts
 * @desc The collab maker's region math, all in percentages of the image (what [imagemap] wants):
 *       pixels to percent, clamping inside the image, rounding to 2 decimals, a rectangle from
 *       two drag points, moving, resizing by a handle, and keyboard nudges. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** A region's box: left, top, width and height, in percent of the image. */
export type Rect = { x: number; y: number; w: number; h: number };

/** A point in percent of the image. */
export type Point = { x: number; y: number };

/** Where an element sits on screen (a DOMRect's fields). */
export type Box = { left: number; top: number; width: number; height: number };

/** A resize handle: the corners and edges, by compass direction. */
export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Every handle, corners first. */
export const HANDLES: readonly Handle[] = ["nw", "ne", "se", "sw", "n", "e", "s", "w"];

/** The smallest region side, in percent. */
export const MIN_SIDE = 1;

/** A nudge's step in percent: plain arrows and with Shift. */
export const NUDGE_STEPS = { small: 0.5, large: 5 } as const;

/**
 * @function roundPercent
 * @param n {number} a percentage
 * @returns {number} rounded to 2 decimals (a hundredth of a percent is under a pixel on any
 *          image osu! shows)
 */
export const roundPercent = (n: number): number => Math.round(n * 100) / 100;

/**
 * @function clamp
 * @param n {number} a number
 * @param min {number} the lowest allowed
 * @param max {number} the highest allowed
 * @returns {number} n kept inside [min, max]
 */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/**
 * @function toPercent
 * @param px {number} a length or offset in pixels
 * @param size {number} the image's size on that axis, in pixels
 * @returns {number} the percentage, clamped to 0..100 (0 while the size is unknown)
 */
export const toPercent = (px: number, size: number): number =>
  size > 0 ? clamp((px / size) * 100, 0, 100) : 0;

/**
 * @function toPixels
 * @param percent {number} a percentage
 * @param size {number} the image's size on that axis, in pixels
 * @returns {number} the pixels
 */
export const toPixels = (percent: number, size: number): number => (percent / 100) * size;

/**
 * @function pointIn
 * @param clientX {number} the pointer's x on screen
 * @param clientY {number} the pointer's y on screen
 * @param box {Box} where the image sits on screen
 * @returns {Point} the pointer in percent of the image, clamped to its edges
 */
export const pointIn = (clientX: number, clientY: number, box: Box): Point => ({
  x: toPercent(clientX - box.left, box.width),
  y: toPercent(clientY - box.top, box.height),
});

/**
 * @function fitRect
 * @param rect {Rect} a rectangle, maybe partly outside the image or too small
 * @returns {Rect} at least MIN_SIDE on each side, inside the image, rounded
 */
export const fitRect = (rect: Rect): Rect => {
  const w = roundPercent(clamp(rect.w, MIN_SIDE, 100));
  const h = roundPercent(clamp(rect.h, MIN_SIDE, 100));
  return {
    x: roundPercent(clamp(rect.x, 0, 100 - w)),
    y: roundPercent(clamp(rect.y, 0, 100 - h)),
    w,
    h,
  };
};

/**
 * @function rectFromPoints
 * @param a {Point} where the drag started
 * @param b {Point} where it is now
 * @returns {Rect} the rectangle between them, rounded (not grown to MIN_SIDE: the caller
 *          decides whether a tiny drag counts)
 */
export const rectFromPoints = (a: Point, b: Point): Rect => {
  const x = roundPercent(clamp(Math.min(a.x, b.x), 0, 100));
  const y = roundPercent(clamp(Math.min(a.y, b.y), 0, 100));
  return {
    x,
    y,
    w: roundPercent(clamp(Math.max(a.x, b.x), 0, 100) - x),
    h: roundPercent(clamp(Math.max(a.y, b.y), 0, 100) - y),
  };
};

/**
 * @function isBigEnough
 * @param rect {Rect} a drawn rectangle
 * @returns {boolean} true when both sides reach MIN_SIDE (smaller drags are clicks)
 */
export const isBigEnough = (rect: Rect): boolean => rect.w >= MIN_SIDE && rect.h >= MIN_SIDE;

/**
 * @function moveRect
 * @param rect {Rect} a region
 * @param dx {number} how far right, in percent
 * @param dy {number} how far down, in percent
 * @returns {Rect} moved and kept inside the image, the same size
 */
export const moveRect = (rect: Rect, dx: number, dy: number): Rect => ({
  ...rect,
  x: roundPercent(clamp(rect.x + dx, 0, 100 - rect.w)),
  y: roundPercent(clamp(rect.y + dy, 0, 100 - rect.h)),
});

/**
 * @function resizeRect
 * @param rect {Rect} a region
 * @param handle {Handle} the handle being dragged
 * @param to {Point} where the pointer is
 * @returns {Rect} the edges that handle holds moved to the pointer, the others fixed, never
 *          under MIN_SIDE and never outside the image
 */
export const resizeRect = (rect: Rect, handle: Handle, to: Point): Rect => {
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.w;
  let bottom = rect.y + rect.h;
  if (handle.includes("w")) left = clamp(to.x, 0, right - MIN_SIDE);
  if (handle.includes("e")) right = clamp(to.x, left + MIN_SIDE, 100);
  if (handle.includes("n")) top = clamp(to.y, 0, bottom - MIN_SIDE);
  if (handle.includes("s")) bottom = clamp(to.y, top + MIN_SIDE, 100);
  const x = roundPercent(left);
  const y = roundPercent(top);
  return { x, y, w: roundPercent(right - x), h: roundPercent(bottom - y) };
};

/** The arrow keys a region answers, with their direction. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * @function nudgeRect
 * @param rect {Rect} a region
 * @param key {string} the KeyboardEvent key
 * @param options {{ large: boolean; resize: boolean }} Shift (a bigger step) and Alt (grow or
 *        shrink from the bottom-right corner instead of moving)
 * @returns {Rect | null} the nudged region, or null for a key that isn't an arrow
 */
export const nudgeRect = (
  rect: Rect,
  key: string,
  { large, resize }: { large: boolean; resize: boolean },
): Rect | null => {
  const arrow = ARROWS[key];
  if (!arrow) return null;
  const step = large ? NUDGE_STEPS.large : NUDGE_STEPS.small;
  const [dx, dy] = [arrow[0] * step, arrow[1] * step];
  if (!resize) return moveRect(rect, dx, dy);
  return resizeRect(rect, "se", { x: rect.x + rect.w + dx, y: rect.y + rect.h + dy });
};
