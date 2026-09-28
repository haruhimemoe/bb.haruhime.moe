/**
 * @file src/services/osu-users.ts
 * @desc Looks up osu! users for the player list. Each query is answered from osu_users when a
 *       live row is there; the rest ask osu!: ids 50 at a time (GET /api/v2/users?ids[]=), names
 *       one at a time (GET /api/v2/users/@name). Each call first takes one from the osu! budget
 *       (`beforeCall`); once it says no, the queries left are unchecked. Found users are kept a
 *       day under both their id and name; a name or id osu! doesn't know, an hour.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { osuUserSchema, toOsuUser } from "@haruhimemoe/osu/shapes";
import { z } from "zod";
import { MISSING_USER_CACHE_SECONDS, OSU_USERS_BATCH, USER_CACHE_SECONDS } from "@/constants/osu";
import { OsuCallError, osuGet } from "@/lib/osu-token";
import { osuUsersCollection, type StoredOsuUser } from "@/models/OsuCache";
import type { PlayerUser } from "@/schemas/osu-users";
import { type PlayerQuery, queryKey } from "@/utils/player-names";

/** What each query key came to: a user, null (osu! has none), or undefined (not asked). */
export type UserLookup = Map<string, PlayerUser | null>;

const usersAnswer = z.object({ users: z.array(z.unknown()) });

const toUser = (raw: unknown): PlayerUser | null => {
  if (!osuUserSchema.safeParse(raw).success) return null;
  const user = toOsuUser(raw);
  const code = user.countryCode?.toUpperCase() ?? null;
  return {
    id: user.osuId,
    username: user.username,
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
  };
};

const expiry = (found: boolean, now: number): Date =>
  new Date(now + (found ? USER_CACHE_SECONDS : MISSING_USER_CACHE_SECONDS) * 1000);

const failed = (response: Response): never => {
  throw new OsuCallError(`osu! answered ${response.status}.`);
};

/**
 * @function lookupIds
 * @param ids {number[]} user ids, at most OSU_USERS_BATCH
 * @returns {Promise<PlayerUser[]>} the users osu! knows among them
 */
const lookupIds = async (ids: number[]): Promise<PlayerUser[]> => {
  const query = ids.map((id) => `ids[]=${id}`).join("&");
  const response = await osuGet(`/api/v2/users?${query}`);
  if (!response.ok) failed(response);
  const body = usersAnswer.safeParse(await response.json().catch(() => null));
  if (!body.success) throw new OsuCallError("osu!'s users answer wasn't readable.");
  return body.data.users.map(toUser).filter((user) => user !== null);
};

/**
 * @function lookupName
 * @param name {string} a username
 * @returns {Promise<PlayerUser | null>} the user, or null when osu! has none by that name
 */
const lookupName = async (name: string): Promise<PlayerUser | null> => {
  const response = await osuGet(`/api/v2/users/@${encodeURIComponent(name)}`);
  if (response.status === 404) return null;
  if (!response.ok) failed(response);
  return toUser(await response.json().catch(() => null));
};

/**
 * @function lookupUsers
 * @param queries {readonly PlayerQuery[]} ids and names (duplicates fine)
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate for this request
 * @returns {Promise<UserLookup>} by queryKey: the user, null when osu! has none, and no entry
 *          when the budget ran out before it was asked
 * @throws {OsuCallError} when osu! can't be reached or answers an error
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
  try {
    for (let i = 0; i < ids.length; i += OSU_USERS_BATCH) {
      if (!(await beforeCall())) break;
      const batch = ids.slice(i, i + OSU_USERS_BATCH);
      const found = await lookupIds(batch);
      for (const id of batch) keep(`id:${id}`, found.find((user) => user.id === id) ?? null);
    }
    for (const [key, query] of unique) {
      if (query.kind !== "name" || answers.has(key)) continue;
      if (!(await beforeCall())) break;
      keep(key, await lookupName(query.name));
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
