/**
 * @file src/utils/banner.ts
 * @desc Banner text for the Art tool: each character drawn in the five-row block font
 *       (BANNER_FONT), one empty column between letters, lowercase drawn as capitals. A
 *       character the font lacks stops the drawing and is listed instead. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { BANNER_FONT, BANNER_ROWS } from "@/constants/ascii";

/** A drawn banner, or the characters that kept it from being drawn. */
export type Banner = { lines: string[]; missing: string[] };

/**
 * @function banner
 * @param text {string} what to draw
 * @returns {Banner} five lines (right edges trimmed), or none and the characters the font lacks
 */
export const banner = (text: string): Banner => {
  const chars = [...text.trim()];
  const glyphOf = (char: string) =>
    Object.hasOwn(BANNER_FONT, char.toUpperCase()) ? BANNER_FONT[char.toUpperCase()] : undefined;
  const missing = [...new Set(chars.filter((char) => glyphOf(char) === undefined))];
  if (chars.length === 0 || missing.length > 0) return { lines: [], missing };
  const glyphs = chars.map((char) => glyphOf(char) ?? []);
  const lines = Array.from({ length: BANNER_ROWS }, (_, row) =>
    glyphs
      .map((glyph) => glyph[row] ?? "")
      .join(" ")
      .trimEnd(),
  );
  return { lines, missing: [] };
};
