/**
 * @file src/constants/forum-patterns.ts
 * @desc What osu! forum posts use, as scripts/mine-forum.ts last wrote it to
 *       content/patterns/forum-tags.json (tag counts only; the full counts are forum.json). Empty until the script has been run with the
 *       osu! app's credentials; everything that reads it falls back to TAGS order then.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import type { ForumPatterns } from "@/utils/forum-patterns";
import mined from "../../content/patterns/forum.json";

/** The mined counts, without where they came from. */
export const FORUM_PATTERNS: ForumPatterns = mined as ForumPatterns;
