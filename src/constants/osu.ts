/**
 * @file src/constants/osu.ts
 * @desc How bb uses the osu! API: the shared call budget (50 a minute across every instance,
 *       20 a minute per IP), where it asks, how many names one lookup takes, how long answers
 *       are kept, and the player list's line styles.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** Every osu! API call bb makes, from any instance. osu! asks for at most 60 a minute. */
export const OSU_API_BUDGET = {
  scope: "osu-api",
  subject: "global",
  limit: 50,
  windowSeconds: 60,
} as const;

/** One IP's share of OSU_API_BUDGET. */
export const OSU_API_BUDGET_PER_IP = { scope: "osu-api-ip", limit: 20, windowSeconds: 60 } as const;

/** osu! itself: the API, and the token endpoint for client credentials. */
export const OSU_BASE_URL = "https://osu.ppy.sh";

/** Ids per GET /api/v2/users call (osu!'s own cap). */
export const OSU_USERS_BATCH = 50;

/** Names or ids one player list may look up. */
export const MAX_PLAYER_NAMES = 64;

/** The longest name or id line we look up (osu! names are at most 15 characters). */
export const MAX_PLAYER_NAME_LENGTH = 32;

/** How long a found user is kept, in seconds. */
export const USER_CACHE_SECONDS = 24 * 60 * 60;

/** How long "osu! has no such user" is kept, in seconds (someone may take the name). */
export const MISSING_USER_CACHE_SECONDS = 60 * 60;

/** The player list's line styles. */
export const PLAYER_LIST_STYLES = [
  { value: "numbered", label: "Numbered list" },
  { value: "bullets", label: "Bullet list" },
  { value: "lines", label: "Plain lines" },
] as const;

/** One of PLAYER_LIST_STYLES. */
export type PlayerListStyle = (typeof PLAYER_LIST_STYLES)[number]["value"];

/** The player list's flag choices: the small PNGs by default. */
export const PLAYER_FLAG_STYLES = [
  { value: "legacy", label: "Small flags" },
  { value: "modern", label: "SVG flags" },
  { value: "none", label: "No flags" },
] as const;
