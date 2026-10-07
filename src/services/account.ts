/**
 * @file src/services/account.ts
 * @desc Deleting someone's bb data: the API key first (so no API call can act for them while
 *       it's deleted), then every template the osu! account owns, their history, and the reports
 *       on them, every report it filed (each template it reported counts one report fewer, and
 *       shows again below the hiding threshold, so deleting and saving again can't stack reports
 *       from one person), and last the user's API rate-limit counters (api, api-write,
 *       key-create). The haruhime account itself (user, sessions, the osu! link) lives in the
 *       hub's identity database, which bb can't write: it's deleted on haruhime.moe/account. A
 *       failure partway can simply be retried. Drafts live in the browser and aren't
 *       ours to delete. Forks of a deleted template keep their own history; reading them finds
 *       no upstream and reads "gone" (src/services/template-upstream.ts), nothing to clean up.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import "server-only";
import { RATE_LIMITS } from "@/constants/api";
import { REPORTS_TO_HIDE } from "@/constants/templates";
import { apiKeys } from "@/lib/api-keys";
import { connectDb } from "@/lib/db";
import { limiter } from "@/lib/rate-limit";
import { templateRevisions } from "@/lib/template-revisions";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import type { SessionUser } from "@/schemas/session-user";

/**
 * @function deleteTemplatesOf
 * @param osuId {number} the osu! account
 * @returns {Promise<number>} how many templates it owned, now deleted with their history, their
 *          reports, and the reports it filed
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
  for (const id of ids) await templateRevisions.removeDoc(id);
  return deletedCount;
};

/**
 * @function deleteBbData
 * @param user {Pick<SessionUser, "id" | "osuId">} the user (their identity id and osu! id)
 * @returns {Promise<{ templatesDeleted: number }>} once their API key, templates and API
 *          counters are gone
 * @throws when a delete fails (the database)
 */
export const deleteBbData = async (
  user: Pick<SessionUser, "id" | "osuId">,
): Promise<{ templatesDeleted: number }> => {
  await connectDb();
  // The API key goes first, so no API call can act for the account while it is deleted.
  await apiKeys.deleteFor(user.id);
  const templatesDeleted = await deleteTemplatesOf(user.osuId);
  await limiter.deleteSubject(
    [RATE_LIMITS.api, RATE_LIMITS.apiWrite, RATE_LIMITS.keyCreate],
    user.id,
  );
  return { templatesDeleted };
};
