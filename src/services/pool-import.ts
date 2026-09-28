/**
 * @file src/services/pool-import.ts
 * @desc Pool import: reads a built pool from pools' public GET /api/pools/<id> (POOLS_URL,
 *       without cookies, so only public and unlisted pools come back; private, hidden and
 *       missing ones are pools' 404), then each map's details and its star rating under its
 *       bucket's mods from osu_beatmaps, asking osu! (@haruhimemoe/osu, within the osu! budget)
 *       for what isn't kept yet. Rows are kept a week. A rating the budget or osu! couldn't give
 *       this time is null and the answer is marked incomplete.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import type { ModAcronym } from "@haruhimemoe/pool";
import { SERVER_USER_AGENT } from "@/constants/site";
import { getPoolsUrl } from "@/env";
import { getOsuClient } from "@/lib/osu";
import { osuBeatmapsCollection, type StoredOsuBeatmap } from "@/models/OsuCache";
import { type PoolImport, type PoolsAnswer, poolsAnswerSchema } from "@/schemas/pool-import";
import { labelOf, poolGroups, starKey } from "@/utils/pool-import";

const POOLS_TIMEOUT_MS = 10_000;
const BEATMAP_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const RATING_CONCURRENCY = 4;

/** pools didn't answer, or answered something bb can't read. */
export class PoolsUnavailableError extends Error {}

/**
 * @function fetchPool
 * @param id {string} a built pool's id (already checked)
 * @returns {Promise<PoolsAnswer["pool"] | null>} the pool, or null when pools has none anyone
 *          may see
 * @throws {PoolsUnavailableError} when pools can't be reached or answers anything else
 */
export const fetchPool = async (id: string): Promise<PoolsAnswer["pool"] | null> => {
  const response = await fetch(`${getPoolsUrl()}/api/pools/${id}`, {
    headers: { accept: "application/json", "user-agent": SERVER_USER_AGENT },
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.timeout(POOLS_TIMEOUT_MS),
  }).catch((cause: unknown) => {
    throw new PoolsUnavailableError("pools didn't answer.", { cause });
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new PoolsUnavailableError(`pools answered ${response.status}.`);
  const parsed = poolsAnswerSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new PoolsUnavailableError("pools' answer wasn't readable.");
  return parsed.data.pool;
};

/**
 * @function loadBeatmaps
 * @param ids {number[]} difficulty ids
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate
 * @returns {Promise<Map<number, StoredOsuBeatmap>>} each map osu! knows (kept or just asked)
 * @throws {OsuApiError} when osu! fails the lookup
 */
const loadBeatmaps = async (
  ids: number[],
  beforeCall: () => Promise<boolean>,
): Promise<Map<number, StoredOsuBeatmap>> => {
  const cache = await osuBeatmapsCollection();
  const now = new Date();
  const rows = await cache.find({ _id: { $in: ids }, expiresAt: { $gt: now } }).toArray();
  const maps = new Map(rows.map((row) => [row._id, row]));
  const missing = ids.filter((id) => !maps.has(id));
  if (missing.length === 0) return maps;
  const { found } = await getOsuClient().getBeatmaps(missing, { beforeCall });
  const expiresAt = new Date(now.getTime() + BEATMAP_CACHE_MS);
  const fresh = [...found.values()].map((meta) => ({
    _id: meta.beatmapId,
    artist: meta.artist,
    title: meta.title,
    version: meta.version,
    creator: meta.creator,
    stars: { "": meta.starRating },
    expiresAt,
  }));
  for (const row of fresh) maps.set(row._id, row);
  if (fresh.length > 0) {
    await cache
      .bulkWrite(
        fresh.map((row) => ({
          replaceOne: { filter: { _id: row._id }, replacement: row, upsert: true },
        })),
        { ordered: false },
      )
      .catch((error: unknown) => console.error("osu_beatmaps write failed", error));
  }
  return maps;
};

/**
 * @function rateAll
 * @param wanted {{ id: number; mods: readonly ModAcronym[] }[]} maps and mod sets not kept yet
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate
 * @returns {Promise<Map<string, number | null>>} by "<id>:<mods>": osu!'s rating, or null when
 *          it couldn't be had this time (budget, an error) or osu! won't rate it
 */
const rateAll = async (
  wanted: { id: number; mods: readonly ModAcronym[] }[],
  beforeCall: () => Promise<boolean>,
): Promise<Map<string, number | null>> => {
  const ratings = new Map<string, number | null>();
  const queue = [...new Map(wanted.map((one) => [`${one.id}:${starKey(one.mods)}`, one])).values()];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const key = `${next.id}:${starKey(next.mods)}`;
      const rating = await getOsuClient()
        .getStarRating(next.id, next.mods, { beforeCall })
        .catch(() => null);
      ratings.set(key, rating);
    }
  };
  await Promise.all(Array.from({ length: RATING_CONCURRENCY }, worker));
  const cache = await osuBeatmapsCollection();
  const writes = [...ratings].flatMap(([key, rating]) => {
    if (rating === null) return [];
    const [id = "0", mods = ""] = key.split(":");
    return [
      {
        updateOne: { filter: { _id: Number(id) }, update: { $set: { [`stars.${mods}`]: rating } } },
      },
    ];
  });
  if (writes.length > 0) {
    await cache.bulkWrite(writes, { ordered: false }).catch((error: unknown) => {
      console.error("osu_beatmaps write failed", error);
    });
  }
  return ratings;
};

/**
 * @function importPool
 * @param id {string} a built pool's id (already checked)
 * @param beforeCall {() => Promise<boolean>} the osu! budget's gate for this request
 * @returns {Promise<PoolImport | null>} the pool's buckets with maps and ratings, or null when
 *          pools has no such pool anyone may see
 * @throws {PoolsUnavailableError} when pools fails
 * @throws {OsuApiError} when osu! fails the map lookup
 */
export const importPool = async (
  id: string,
  beforeCall: () => Promise<boolean>,
): Promise<PoolImport | null> => {
  const pool = await fetchPool(id);
  if (!pool) return null;
  const groups = poolGroups(pool);
  const ids = [...new Set(pool.slots.map((slot) => slot.beatmapId))];
  const maps = ids.length > 0 ? await loadBeatmaps(ids, beforeCall) : new Map();
  const wanted = groups.flatMap((group) =>
    group.slots
      .filter((slot) => maps.get(slot.beatmapId)?.stars[starKey(group.mods)] === undefined)
      .filter((slot) => maps.has(slot.beatmapId))
      .map((slot) => ({ id: slot.beatmapId, mods: group.mods })),
  );
  const rated = await rateAll(wanted, beforeCall);
  let complete = true;
  const buckets = groups.map((group) => ({
    code: group.code,
    mods: starKey(group.mods),
    slots: group.slots.map((slot) => {
      const row = maps.get(slot.beatmapId);
      const key = starKey(group.mods);
      const stars = row?.stars[key] ?? rated.get(`${slot.beatmapId}:${key}`) ?? null;
      if (stars === null) complete = false;
      return {
        label: labelOf(slot),
        beatmapId: slot.beatmapId,
        map: row
          ? { artist: row.artist, title: row.title, version: row.version, creator: row.creator }
          : null,
        stars,
      };
    }),
  }));
  return { id, name: pool.name, url: `${getPoolsUrl()}/pools/${id}`, buckets, complete };
};
