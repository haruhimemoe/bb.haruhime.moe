/**
 * @file src/constants/emoji-types.ts
 * @desc The Emoji tool's groups and entry shape, shared by the emoji lists.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

/** The emoji groups, in the order the tool shows them. */
export const EMOJI_GROUPS = [
  "smileys",
  "people",
  "hearts",
  "animals",
  "food",
  "activities",
  "travel",
  "music",
] as const;

/** One emoji group. */
export type EmojiGroup = (typeof EMOJI_GROUPS)[number];

/** One emoji and the words it's found by (the first names its button). */
export type EmojiEntry = readonly [emoji: string, words: string];
