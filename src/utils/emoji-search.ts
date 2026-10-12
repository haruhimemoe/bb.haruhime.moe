/**
 * @file src/utils/emoji-search.ts
 * @desc Searching the Emoji tool's list (src/constants/emoji.ts): every typed word has to start
 *       one of the emoji's words, case ignored. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { EMOJI, type EmojiEntry } from "@/constants/emoji";

const ALL: readonly EmojiEntry[] = Object.values(EMOJI).flat();

/**
 * @function searchEmoji
 * @param query {string} what was typed
 * @returns {EmojiEntry[]} the matching emoji in list order, none for blank text
 */
export const searchEmoji = (query: string): EmojiEntry[] => {
  const wanted = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (wanted.length === 0) return [];
  return ALL.filter(([, words]) => {
    const own = words.split(" ");
    return wanted.every((word) => own.some((one) => one.startsWith(word)));
  });
};
