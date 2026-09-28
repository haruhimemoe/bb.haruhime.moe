/**
 * @file src/services/osu-users.ts
 * @desc Looks up osu! users for the player list. Each query is answered from osu_users when a
 *       live row is there; the rest ask osu! through @haruhimemoe/osu's client: ids with getUsers
 *       (50 a call), names one at a time with getUser (/users/@name). Each call first takes one
 *       from the osu! budget (`beforeCall`); once it says no, the queries left are unchecked.
 *       Found users are kept a day under both their id and name; a name or id osu! doesn't know,
 *       an hour.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import type { OsuUser } from "@haruhimemoe/osu/shapes";
import { MISSING_USER_CACHE_SECONDS, USER_CACHE_SECONDS } from "@/constants/osu";
import { getOsuClient } from "@/lib/osu";
import { osuUsersCollection, type StoredOsuUser } from "@/models/OsuCache";
import type { PlayerUser } from "@/schemas/osu-users";
import { type PlayerQuery, queryKey } from "@/utils/player-names";

/** What each query key came to: a user, null (osu! has none), or undefined (not asked). */
export type UserLookup = Map<string, PlayerUser | null>;

const toPlayer = (user: OsuUser): PlayerUser => {
  const code = user.countryCode?.toUpperCase() ?? null;
  return {
    id: user.osuId,
    username: user.username,
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
  };
};

const expiry = (found: boolean, now: number): Date =>
  new Date(now + (found ? USER_CACHE_SECONDS : MISSING_USER_CACHE_SECONDS) * 1000);

/**
 * @function lookupUsers
 * @param queries {readonly PlayerQuery[]} ids and names (duplicates fine)
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate for this request
 * @returns {Promise<UserLookup>} by queryKey: the user, null when osu! has none, and no entry
 *          when the budget ran out before it was asked
 * @throws {OsuApiError} when osu! can't be reached or answers an error
 */
export const lookupUsers = async (
  queries: readonly PlayerQuery[],
  beforeCall: () => Promise<boolean>,
): Promise<UserLookup> => {
  const now = Date.now();
  const unique = new Map(queries.map((query) => [queryKey(query), query]));
  const cache = await osuUsersCollection();
  const rows = await cache
    .find({ _id: { $in: [...unique.keys()] }, expiresAt: { $gt: new Date(now) } })
    .toArray();
  const answers: UserLookup = new Map(rows.map((row) => [row._id, row.user]));
  const fresh = new Map<string, StoredOsuUser>();
  const keep = (key: string, user: PlayerUser | null) => {
    answers.set(key, user);
    const keys = user
      ? [key, `id:${user.id}`, queryKey({ kind: "name", name: user.username })]
      : [key];
    for (const _id of keys) fresh.set(_id, { _id, user, expiresAt: expiry(user !== null, now) });
  };
  const ids = [...unique.values()].flatMap((q) =>
    q.kind === "id" && !answers.has(queryKey(q)) ? [q.id] : [],
  );
  const osu = getOsuClient();
  try {
    if (ids.length > 0) {
      // Ids in a batch the budget refused come back unchecked and stay unasked.
      const { found, missing } = await osu.getUsers(ids, { beforeCall });
      for (const [id, user] of found) keep(`id:${id}`, toPlayer(user));
      for (const id of missing) keep(`id:${id}`, null);
    }
    for (const [key, query] of unique) {
      if (query.kind !== "name" || answers.has(key)) continue;
      if (!(await beforeCall())) break;
      const user = await osu.getUser(query.name);
      keep(key, user ? toPlayer(user) : null);
    }
  } finally {
    // Keep what osu! said even when a later call failed; a cache that can't be written only
    // costs the next lookup a call.
    if (fresh.size > 0) {
      await cache
        .bulkWrite(
          [...fresh.values()].map((row) => ({
            replaceOne: { filter: { _id: row._id }, replacement: row, upsert: true },
          })),
          { ordered: false },
        )
        .catch((error: unknown) => console.error("osu_users write failed", error));
    }
  }
  return answers;
};
