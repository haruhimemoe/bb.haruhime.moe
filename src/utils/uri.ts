/**
 * @file src/utils/uri.ts
 * @desc decodeURIComponent that answers null for a malformed escape (a lone `%E0`) instead of
 *       throwing, for ids and names read from URLs people paste or type.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/**
 * @function decodeUriPart
 * @param text {string} a URL component
 * @returns {string | null} the decoded text, or null when an escape in it is malformed
 */
export const decodeUriPart = (text: string): string | null => {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
};
