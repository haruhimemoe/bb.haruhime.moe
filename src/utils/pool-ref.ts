/**
 * @file src/utils/pool-ref.ts
 * @desc Reads what someone typed into pool import: a built pool's id (`b-` and 8 letters or
 *       digits) or a pools.haruhime.moe link to it (its page, its editor, with or without a
 *       query). A past pool (a link to one, or a slug id with a dash) is recognized and refused,
 *       since pools shares only built pools. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

/** A built pool's id on pools. */
export const BUILT_POOL_ID = /^b-[a-z][0-9a-z]{7}$/;

/** A past pool's id on pools (a slug). */
const PAST_POOL_ID = /^[a-z0-9-]{1,64}$/;

/** What parsePoolRef found. */
export type PoolRef =
  | { ok: true; id: string }
  | { ok: false; reason: "past" | "invalid"; message: string };

/** Why a line isn't a pool we can import. */
export const POOL_REF_MESSAGES = {
  past: "That's a past pool. Only pools built on pools.haruhime.moe can be imported for now.",
  invalid: "Enter a pool's id, like b-abcd1234, or its pools.haruhime.moe link.",
} as const;

/**
 * @function parsePoolRef
 * @param input {string} an id or a link, as typed
 * @returns {PoolRef} the built pool's id, or why it can't be imported
 */
export const parsePoolRef = (input: string): PoolRef => {
  const trimmed = input.trim();
  const fromPath = /^(?:https?:\/\/)?[^/\s]+\/pools\/([^/?#\s]+)/i.exec(trimmed)?.[1];
  const id = (fromPath ?? trimmed).toLowerCase();
  if (BUILT_POOL_ID.test(id)) return { ok: true, id };
  // Past pools have slug ids like "owc-2024-qualifiers": a link to one, or a bare id with a dash.
  const past =
    PAST_POOL_ID.test(id) && !id.startsWith("b-") && (fromPath !== undefined || id.includes("-"));
  const reason = past ? "past" : "invalid";
  return { ok: false, reason, message: POOL_REF_MESSAGES[reason] };
};
