/**
 * @file src/lib/bbcode.ts
 * @desc The one seam every BBCode preview goes through (the editor, the docs' live examples,
 *       template cards and template pages): @haruhimemoe/bbcode's render, whose HTML escapes every
 *       text node and checks every URL, color and size, so it needs no further sanitizing; and
 *       its count, in code points against osu!'s limit. Pure, and safe in the browser. Text nested
 *       too deep for the renderer's recursion (a few thousand levels, which fits in 60,000
 *       characters) shows as escaped text, so one stored template can't break a page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { count, render } from "@haruhimemoe/bbcode";

/**
 * @function renderBbcode
 * @param text {string} BBCode source
 * @returns {string} safe HTML for the preview, wrapped in `<div class="bb">`; the source as
 *          escaped text when it nests too deep to render
 */
export const renderBbcode = (text: string): string => {
  try {
    return render(text);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return `<div class="bb">${escapeText(text)}</div>`;
  }
};

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for HTML and keeps its line breaks. */
const escapeText = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] as string).replace(/\r?\n/g, "<br>");

/**
 * @function countBbcode
 * @param text {string} BBCode source
 * @returns {number} how many characters osu! counts against its limit (code points, tags
 *          included)
 */
export const countBbcode = (text: string): number => count(text).length;
