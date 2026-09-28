/**
 * @file src/utils/contrast.ts
 * @desc WCAG 2 contrast between two colors, for the color tool's warning, and the hex value
 *       behind what someone typed (a hex code, or a name the swatches know). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { SWATCHES } from "@/constants/colors";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * @function hexToRgb
 * @param hex {string} `#rgb` or `#rrggbb` (the # is optional)
 * @returns {[number, number, number] | null} the channels 0..255, or null for anything else
 */
export const hexToRgb = (hex: string): [number, number, number] | null => {
  const match = HEX.exec(hex.trim());
  if (!match?.[1]) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
};

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/**
 * @function luminance
 * @param rgb {[number, number, number]} channels 0..255
 * @returns {number} the relative luminance, 0 (black) to 1 (white)
 */
export const luminance = ([r, g, b]: [number, number, number]): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/**
 * @function contrastRatio
 * @param a {string} a hex color
 * @param b {string} another
 * @returns {number | null} their WCAG ratio, 1 to 21, or null when either isn't hex
 */
export const contrastRatio = (a: string, b: string): number | null => {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  if (!x || !y) return null;
  const [light, dark] = [luminance(x), luminance(y)].sort((m, n) => n - m) as [number, number];
  return (light + 0.05) / (dark + 0.05);
};

/**
 * @function colorHex
 * @param value {string} a hex code or a color name
 * @returns {string | null} its `#rrggbb` value, or null when it's a name the swatches don't know
 */
export const colorHex = (value: string): string | null => {
  const rgb = value.trim().startsWith("#") ? hexToRgb(value) : null;
  if (rgb) return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  const name = value.trim().toLowerCase();
  return SWATCHES.find((swatch) => swatch.value === name)?.hex ?? null;
};
