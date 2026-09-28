/**
 * @file src/models/OsuCache.ts
 * @desc What bb keeps of osu!'s answers, as typed driver collections: osu_users (a lookup by id
 *       or name: the user, or that osu! has none) and osu_beatmaps (a difficulty's metadata and
 *       its star ratings under the mod sets asked so far). Each row carries `expiresAt`, and a
 *       TTL index on it (src/lib/db-indexes.ts) removes it then.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import type { Collection } from "mongodb";
import { OSU_BEATMAPS_COLLECTION, OSU_USERS_COLLECTION } from "@/constants/db";
import { connectedDb } from "@/lib/db";

/** A user lookup: `_id` "id:2" or "name:peppy"; `user` null when osu! has no such user. */
export type StoredOsuUser = {
  _id: string;
  user: { id: number; username: string; countryCode: string | null } | null;
  expiresAt: Date;
};

/** A difficulty: `_id` its id; `stars` by mod set ("" for none, "HDHR"), each looked up once. */
export type StoredOsuBeatmap = {
  _id: number;
  artist: string;
  title: string;
  version: string;
  creator: string;
  stars: Record<string, number>;
  expiresAt: Date;
};

/**
 * @function osuUsersCollection
 * @returns {Promise<Collection<StoredOsuUser>>} osu_users on the connected database
 */
export const osuUsersCollection = async (): Promise<Collection<StoredOsuUser>> =>
  (await connectedDb()).collection<StoredOsuUser>(OSU_USERS_COLLECTION);

/**
 * @function osuBeatmapsCollection
 * @returns {Promise<Collection<StoredOsuBeatmap>>} osu_beatmaps on the connected database
 */
export const osuBeatmapsCollection = async (): Promise<Collection<StoredOsuBeatmap>> =>
  (await connectedDb()).collection<StoredOsuBeatmap>(OSU_BEATMAPS_COLLECTION);
