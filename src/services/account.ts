/**
 * @file src/services/account.ts
 * @desc Deleting an account: every template the osu! account owns and the reports on them,
 *       every report it filed (each template it reported counts one report fewer, and shows
 *       again below the hiding threshold, so deleting and signing in again can't stack reports
 *       from one person), then every
 *       session (so no cookie works again), every linked osu! account row, and the user last. A
 *       failure partway leaves a user row that the next osu! sign-in relinks, so they can sign
 *       in and try again. Sessions, accounts and the user go through better-auth's own adapter,
 *       which knows how it stores ids. Drafts live in the browser and aren't ours to delete.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { REPORTS_TO_HIDE } from "@/constants/templates";
import { getAuth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import type { SessionUser } from "@/schemas/session-user";

/**
 * @function deleteTemplatesOf
 * @param osuId {number} the osu! account
 * @returns {Promise<number>} how many templates it owned, now deleted with their reports and
 *          the reports it filed
 */
export const deleteTemplatesOf = async (osuId: number): Promise<number> => {
  const templates = await templatesCollection();
  const reports = await templateReportsCollection();
  const owned = await templates.find({ ownerOsuId: osuId }, { projection: { _id: 1 } }).toArray();
  const ids = owned.map((row) => row._id);
  await reports.deleteMany({ templateId: { $in: ids } });
  const filed = await reports
    .find({ reporterOsuId: osuId, templateId: { $nin: ids } }, { projection: { templateId: 1 } })
    .toArray();
  await reports.deleteMany({ reporterOsuId: osuId });
  const reported = filed.map((row) => row.templateId);
  if (reported.length > 0) {
    await templates.updateMany(
      { _id: { $in: reported }, reports: { $gt: 0 } },
      { $inc: { reports: -1 } },
    );
    await templates.updateMany(
      { _id: { $in: reported }, hidden: true, reports: { $lt: REPORTS_TO_HIDE } },
      { $set: { hidden: false } },
    );
  }
  const { deletedCount } = await templates.deleteMany({ ownerOsuId: osuId });
  return deletedCount;
};

/**
 * @function deleteAccount
 * @param user {Pick<SessionUser, "id" | "osuId">} the user, as better-auth hands out their id
 * @returns {Promise<{ templatesDeleted: number }>} once their templates, sessions, accounts and
 *          user are gone
 * @throws when a delete fails (the database)
 */
export const deleteAccount = async (
  user: Pick<SessionUser, "id" | "osuId">,
): Promise<{ templatesDeleted: number }> => {
  await connectDb();
  const templatesDeleted = await deleteTemplatesOf(user.osuId);
  const { internalAdapter } = await getAuth().$context;
  await internalAdapter.deleteUserSessions(user.id);
  await internalAdapter.deleteAccounts(user.id);
  await internalAdapter.deleteUser(user.id);
  return { templatesDeleted };
};
