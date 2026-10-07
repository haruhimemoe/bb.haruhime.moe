/**
 * @file src/constants/db.ts
 * @desc Collection names in the bb database, how long a public read may run, and the index
 *       names the templates collection owns, and every field holding an identity user id (for
 *       the hub's identity migration).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

/** Templates people make here. */
export const TEMPLATES_COLLECTION = "templates";
/** Every template's revisions (src/lib/template-revisions.ts). */
export const TEMPLATE_REVISIONS_COLLECTION = "template_revisions";
/** One row per reporter per template. */
export const TEMPLATE_REPORTS_COLLECTION = "template_reports";
/** How often each built-in template was used (they live in the repo, not in templates). */
export const BUILTIN_USES_COLLECTION = "builtin_template_uses";
/** osu! users looked up by id or name, kept a day (a name osu! doesn't know, an hour). */
export const OSU_USERS_COLLECTION = "osu_users";
/** Beatmaps pool import looked up: metadata and star ratings under mods, kept a week. */
export const OSU_BEATMAPS_COLLECTION = "osu_beatmaps";
/** Rate-limit counters. */
export const RATE_LIMITS_COLLECTION = "rate_limits";

/** API keys (next-kit's api-keys store), one per user, keyed by the identity user id. */
export const API_KEYS_COLLECTION = "api_keys";

/**
 * Every bb field holding an identity user id, as next-kit's migrateIdentity takes them. Templates,
 * reports and revisions key people by osu! id, which the migration doesn't change. rate_limits'
 * api, api-write and key-create counters embed the user id in their _id; they expire within the
 * hour, so they aren't listed.
 */
export const USER_ID_REFERENCES: readonly { collection: string; field: string }[] = [
  { collection: API_KEYS_COLLECTION, field: "userId" },
];

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
