/**
 * @file src/constants/emoji.ts
 * @desc The Emoji tool's list: about 390 common emoji in 8 groups, each with English search
 *       words. Curated in the repo (no emoji package): osu! shows emoji as text in the reader's
 *       own font, so the emoji itself is all the post needs. The entries are split across
 *       emoji-faces.ts and emoji-things.ts to keep files short.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { EMOJI_FACES } from "@/constants/emoji-faces";
import { EMOJI_THINGS } from "@/constants/emoji-things";
import type { EmojiEntry, EmojiGroup } from "@/constants/emoji-types";

/** Every emoji by group. */
export const EMOJI: Readonly<Record<EmojiGroup, readonly EmojiEntry[]>> = {
  ...EMOJI_FACES,
  ...EMOJI_THINGS,
};
