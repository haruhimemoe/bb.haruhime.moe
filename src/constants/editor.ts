/**
 * @file src/constants/editor.ts
 * @desc The editor's browser storage keys (its named drafts, stage 1's single draft, and the
 *       hand-off a template's "Use" leaves for it), draft limits, how long it waits before
 *       saving, the post limit and targets, and the preview's background.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { LIMITS } from "@haruhimemoe/bbcode";
import { BODY_MAX } from "@/constants/templates";

/** localStorage key of the editor's named drafts (JSON, src/schemas/draft.ts). */
export const DRAFTS_KEY = "bb:drafts";
/** localStorage key of stage 1's single draft: moved into DRAFTS_KEY once, then removed. */
export const LEGACY_DRAFT_KEY = "bb:draft";
/** The most drafts one browser keeps. */
export const MAX_DRAFTS = 50;
/** The longest draft name. */
export const DRAFT_NAME_MAX = 60;
/** The name a template's "Use" gives its new draft. */
export const HANDOFF_DRAFT_NAME = "From a template";
/** localStorage key a template's "Use" writes and the editor takes (and removes) on load. */
export const HANDOFF_KEY = "bb:handoff";
/** How long the editor waits after typing before it saves the draft (ms). */
export const AUTOSAVE_DELAY_MS = 400;
/** Every osu! post target holds this many characters (FORUM_POST_MAX_LENGTH). */
export const POST_LIMIT = BODY_MAX;

/**
 * The preview's background: @haruhimemoe/bbcode's `--bb-bg`, close to osu!'s dark post
 * background. Colors are checked for contrast against it.
 */
export const PREVIEW_BACKGROUND = "#2a2630";

/** What a post is for: each has its own character limit on osu! (all 60,000 today). */
export const POST_TARGETS = [
  { id: "userpage", label: "Userpage (me!)", limit: LIMITS.userpage },
  { id: "forum", label: "Forum post", limit: LIMITS.forumPost },
  { id: "beatmap", label: "Beatmap description", limit: LIMITS.beatmapDescription },
] as const;

/** One of POST_TARGETS' ids. */
export type PostTarget = (typeof POST_TARGETS)[number]["id"];
