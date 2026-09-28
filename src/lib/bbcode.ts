/**
 * @file src/lib/bbcode.ts
 * @desc The one seam every BBCode preview goes through (the editor shell, template cards and
 *       template pages). For now it shows the source as plain text: every character that means
 *       something in HTML is escaped, and the result sits in a <pre>, so the HTML it returns
 *       needs no further sanitizing. The next stage swaps the body of renderBbcode for
 *       @haruhimemoe/bbcode's render and countBbcode for its count; callers stay the same.
 *       Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

const ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * @function escapeHtml
 * @param text {string} any text
 * @returns {string} the text with &, <, >, " and ' escaped
 */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

/**
 * @function renderBbcode
 * @param text {string} BBCode source
 * @returns {string} safe HTML for the preview: the source, escaped, in a <pre class="bb-source">
 */
export const renderBbcode = (text: string): string =>
  `<pre class="bb-source">${escapeHtml(text)}</pre>`;

/**
 * @function countBbcode
 * @param text {string} BBCode source
 * @returns {number} how many characters osu! counts against its limit (for now, the source's
 *          length in UTF-16 code units, as a textarea's maxlength counts)
 */
export const countBbcode = (text: string): number => text.length;
