/**
 * @file src/constants/db.ts
 * @desc Collection names in the bb database, how long a public read may run, and the index
 *       names the templates collection owns. better-auth's index names are next-kit's
 *       AUTH_INDEXES.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** Templates people make here. */
export const TEMPLATES_COLLECTION = "templates";
/** One row per reporter per template. */
export const TEMPLATE_REPORTS_COLLECTION = "template_reports";
/** How often each built-in template was used (they live in the repo, not in templates). */
export const BUILTIN_USES_COLLECTION = "builtin_template_uses";
/** Rate-limit counters. */
export const RATE_LIMITS_COLLECTION = "rate_limits";

/** maxTimeMS on every public read. */
export const QUERY_TIME_MS = 2000;

/** Index names on templates. */
export const TEMPLATE_INDEXES = Object.freeze({
  /** Your templates, newest change first, and the per-owner count. */
  owner: "ownerOsuId_1_updatedAt_-1",
  /** The gallery's Newest. */
  listedRecent: "visibility_1_updatedAt_-1",
  /** The gallery's Most used. */
  listedUses: "visibility_1_uses_-1",
  /** The gallery's search. */
  text: "name_text_description_text",
  /** Moderation: hidden templates. */
  hidden: "hidden_1",
});

/** Index names on template_reports. */
export const TEMPLATE_REPORT_INDEXES = Object.freeze({
  /** One report per reporter per template. */
  unique: "templateId_1_reporterOsuId_1",
  /** A deleted account's reports. */
  reporter: "reporterOsuId_1",
});
