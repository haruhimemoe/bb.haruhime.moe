/**
 * @file src/lib/bbcode.ts
 * @desc The one seam every BBCode preview goes through (the editor, the docs' live examples,
 *       template cards and template pages): @haruhimemoe/bbcode's render, whose HTML escapes every
 *       text node and checks every URL, color and size, so it needs no further sanitizing; and
 *       its count, in code points against osu!'s limit. Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { count, render } from "@haruhimemoe/bbcode";

/**
 * @function renderBbcode
 * @param text {string} BBCode source
 * @returns {string} safe HTML for the preview, wrapped in `<div class="bb">`
 */
export const renderBbcode = (text: string): string => render(text);

/**
 * @function countBbcode
 * @param text {string} BBCode source
 * @returns {number} how many characters osu! counts against its limit (code points, tags
 *          included)
 */
export const countBbcode = (text: string): number => count(text).length;
