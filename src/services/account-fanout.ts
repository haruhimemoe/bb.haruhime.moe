/**
 * @file src/services/account-fanout.ts
 * @desc What the hub's account fan-out (/api/internal/account/[op]) exports and deletes in bb,
 *       given only an identity user id. bb keys templates and reports by osu! id, read from
 *       the hub's identity database (read-only). The hub deletes identity last, so the user is
 *       still there; when it isn't, osu! id 0 (osu! ids start at 1) matches no template, and the
 *       API key and counters still go.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import "server-only";
import { ObjectId } from "mongodb";
import { apiKeys } from "@/lib/api-keys";
import { connectDb, getIdentityDb } from "@/lib/db";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import { deleteBbData } from "@/services/account";

/** Stands in for a user identity no longer has: no osu! account has id 0. */
const NO_OSU_ID = 0;

/**
 * @function osuIdOf
 * @param userId {string} an identity user id (24 hex)
 * @returns {Promise<number>} their osu! id, or NO_OSU_ID when identity has no such user
 */
const osuIdOf = async (userId: string): Promise<number> => {
  const user = await getIdentityDb()
    .collection("user")
    .findOne({ _id: new ObjectId(userId) }, { projection: { osuId: 1 } });
  return typeof user?.osuId === "number" ? user.osuId : NO_OSU_ID;
};

/**
 * @function exportAccountData
 * @param userId {string} an identity user id
 * @returns {Promise<object>} their templates, the reports they filed and their API key's info
 */
export const exportAccountData = async (userId: string): Promise<object> => {
  await connectDb();
  const osuId = await osuIdOf(userId);
  const templates = await (await templatesCollection()).find({ ownerOsuId: osuId }).toArray();
  const reports = await (await templateReportsCollection())
    .find({ reporterOsuId: osuId })
    .toArray();
  return { templates, reports, apiKey: await apiKeys.info(userId) };
};

/**
 * @function deleteAccountData
 * @param userId {string} an identity user id
 * @returns {Promise<void>} once deleteBbData ran for them (running it again is fine)
 */
export const deleteAccountData = async (userId: string): Promise<void> => {
  await connectDb();
  await deleteBbData({ id: userId, osuId: await osuIdOf(userId) });
};
