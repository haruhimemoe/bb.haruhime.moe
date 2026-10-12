/**
 * @file src/utils/profile-ref.ts
 * @desc Which [profile] pair is under the mouse on a line, for the editor's profile hover: its
 *       range on the line and who to look up (the `=id` when there is one, else the name between
 *       the tags). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

/** A [profile] pair on a line: where it is and who it names. */
export type ProfileRef = { from: number; to: number; query: string };

const PAIR = /\[profile(?:=(\d+))?\]([^[\n]*?)\[\/profile\]/g;

/**
 * @function profileAt
 * @param line {string} one line of the editor's text
 * @param column {number} the offset on that line under the mouse
 * @returns {ProfileRef | null} the pair there, or null (none there, or it names nobody)
 */
export const profileAt = (line: string, column: number): ProfileRef | null => {
  for (const match of line.matchAll(PAIR)) {
    const from = match.index;
    const to = from + match[0].length;
    if (column < from || column > to) continue;
    const query = (match[1] ?? match[2] ?? "").trim();
    return query === "" ? null : { from, to, query };
  }
  return null;
};
