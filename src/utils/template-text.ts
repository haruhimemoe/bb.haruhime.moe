/**
 * @file src/utils/template-text.ts
 * @desc Short copy about templates the pages share. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/**
 * @function usesText
 * @param uses {number} how often a template was used
 * @returns {string} "Not used yet", "Used once" or "Used 1,234 times"
 */
export const usesText = (uses: number): string => {
  if (uses <= 0) return "Not used yet";
  if (uses === 1) return "Used once";
  return `Used ${uses.toLocaleString("en-US")} times`;
};
