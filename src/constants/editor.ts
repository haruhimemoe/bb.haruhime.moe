/**
 * @file src/constants/editor.ts
 * @desc The editor shell's browser storage keys (its autosaved draft, and the hand-off a
 *       template's "Use" leaves for it), how long it waits before saving, and the post targets
 *       with their character limits.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { BODY_MAX } from "@/constants/templates";

/** localStorage key of the editor's autosaved draft. */
export const DRAFT_KEY = "bb:draft";
/** localStorage key a template's "Use" writes and the editor takes (and removes) on load. */
export const HANDOFF_KEY = "bb:handoff";
/** How long the editor waits after typing before it saves the draft (ms). */
export const AUTOSAVE_DELAY_MS = 400;
/** Every osu! post target holds this many characters (FORUM_POST_MAX_LENGTH). */
export const POST_LIMIT = BODY_MAX;
