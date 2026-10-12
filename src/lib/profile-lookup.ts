/**
 * @file src/lib/profile-lookup.ts
 * @desc Looks up one osu! user for the editor's profile hover through POST /api/osu/users (same
 *       origin, its per-IP limit and server cache). Answers are kept for the page's life by
 *       name, in lower case as osu! matches them, so hovering again costs nothing. Told to slow
 *       down (the per-IP limit, shared with the Players tool, or the osu! budget), it waits a
 *       minute before asking about that name again; after a failure, the next hover asks again.
 *       Browser only.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { type PlayerUser, playerLookupAnswerSchema } from "@/schemas/osu-users";
import { sendJson } from "@/utils/api-client";

/** What a lookup came to. */
export type ProfileResult =
  | { kind: "found"; user: PlayerUser }
  | { kind: "missing" }
  | { kind: "busy" }
  | { kind: "failed" };

/** How long a "slow down" answer is kept before asking again (ms). */
const BUSY_WAIT_MS = 60_000;

const answers = new Map<string, { result: Promise<ProfileResult>; until: number }>();

const ask = async (query: string): Promise<ProfileResult> => {
  try {
    const response = await sendJson("/api/osu/users", "POST", { names: [query] });
    if (response.status === 429) return { kind: "busy" };
    if (!response.ok) return { kind: "failed" };
    const parsed = playerLookupAnswerSchema.safeParse(await response.json());
    if (!parsed.success) return { kind: "failed" };
    const [user] = parsed.data.users;
    if (user) return { kind: "found", user };
    return parsed.data.unchecked.length > 0 ? { kind: "busy" } : { kind: "missing" };
  } catch {
    return { kind: "failed" };
  }
};

/**
 * @function lookupProfile
 * @param query {string} an osu! user id or username
 * @returns {Promise<ProfileResult>} the user, missing, busy (rate limit or budget) or failed
 */
export const lookupProfile = (query: string): Promise<ProfileResult> => {
  const key = query.trim().toLowerCase();
  const known = answers.get(key);
  if (known && Date.now() < known.until) return known.result;
  const result = ask(query.trim()).then((answer) => {
    if (answer.kind === "failed") answers.delete(key);
    if (answer.kind === "busy") answers.set(key, { result, until: Date.now() + BUSY_WAIT_MS });
    return answer;
  });
  answers.set(key, { result, until: Number.POSITIVE_INFINITY });
  return result;
};
