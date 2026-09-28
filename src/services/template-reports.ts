/**
 * @file src/services/template-reports.ts
 * @desc Reports and moderation. A signed-in person reports a template they can see and don't own,
 *       once per template (a unique index on template and reporter; a second report is a 409).
 *       Each report bumps the template's counter; a public one at REPORTS_TO_HIDE is hidden,
 *       everywhere but its owner's and admins' views, until an admin clears it. Clearing resets
 *       the counter and unhides it, and keeps the report rows, so the same people can't report
 *       it again (the counter is "reports since the last clear"). Built-in templates are ours
 *       and can't be reported.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { isDuplicateKeyError } from "@haruhimemoe/next-kit/mongo";
import { QUERY_TIME_MS } from "@/constants/db";
import { REPORTS_TO_HIDE } from "@/constants/templates";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import type { TemplateView } from "@/schemas/template-view";
import { type Answer, accept, NOT_FOUND, refuse } from "@/utils/answer";
import { canView, isOwner, shouldHide, type Viewer } from "@/utils/template-access";
import { isBuiltinId } from "@/utils/template-ids";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate, readStored } from "./templates-read";

/** A reported template, with its latest reasons, for admins. */
export type ReportedTemplate = { template: TemplateView; reports: number; reasons: string[] };

/**
 * @function reportTemplate
 * @param id {string} the template id
 * @param reporter {NonNullable<Viewer>} who reports it
 * @param reason {string} why (checked by reportBodySchema)
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<{ hidden: boolean }>>} whether it's hidden now, or a refusal
 */
export const reportTemplate = async (
  id: string,
  reporter: NonNullable<Viewer>,
  reason: string,
  now: Date = new Date(),
): Promise<Answer<{ hidden: boolean }>> => {
  if (isBuiltinId(id)) return refuse(403, "built_in", "Built-in templates can't be reported.");
  const stored = await findStoredTemplate(id);
  if (!stored || !canView(stored, reporter)) return NOT_FOUND;
  if (isOwner(stored, reporter)) {
    return refuse(403, "own_template", "You can't report your own template.");
  }
  try {
    await (await templateReportsCollection()).insertOne({
      templateId: id,
      reporterOsuId: reporter.osuId,
      reason,
      at: now,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return refuse(409, "already_reported", "You've already reported this template.");
  }
  const templates = await templatesCollection();
  const after = await templates.findOneAndUpdate(
    { _id: id },
    { $inc: { reports: 1 } },
    { returnDocument: "after" },
  );
  if (!after) return NOT_FOUND;
  if (!after.hidden && shouldHide(after.visibility, after.reports, REPORTS_TO_HIDE)) {
    await templates.updateOne({ _id: id }, { $set: { hidden: true } });
    return accept({ hidden: true });
  }
  return accept({ hidden: after.hidden });
};

/**
 * @function clearReports
 * @param id {string} the template id
 * @returns {Promise<Answer<TemplateView>>} the template, unhidden with its counter at 0, or a
 *          404 (no such template, a built-in one, or a private one admins never see)
 */
export const clearReports = async (id: string): Promise<Answer<TemplateView>> => {
  const stored = await findStoredTemplate(id);
  if (!stored || stored.visibility === "private") return NOT_FOUND;
  const templates = await templatesCollection();
  const after = await templates.findOneAndUpdate(
    { _id: id },
    { $set: { reports: 0, hidden: false } },
    { returnDocument: "after" },
  );
  const view = after ? readStored(after) : null;
  return view ? accept(toTemplateView(view)) : NOT_FOUND;
};

/**
 * @function listReportedTemplates
 * @param limit {number} most templates (default 50)
 * @returns {Promise<ReportedTemplate[]>} templates others can see with reports since their last
 *          clear, hidden ones first, then by count, each with up to 5 latest reasons
 */
export const listReportedTemplates = async (limit = 50): Promise<ReportedTemplate[]> => {
  const templates = await templatesCollection();
  const rows = await templates
    .find({ reports: { $gt: 0 }, visibility: { $ne: "private" } }, { maxTimeMS: QUERY_TIME_MS })
    .sort({ hidden: -1, reports: -1, _id: 1 })
    .limit(limit)
    .toArray();
  const reports = await templateReportsCollection();
  const listed: ReportedTemplate[] = [];
  for (const row of rows) {
    const stored = readStored(row);
    if (!stored) continue;
    const latest = await reports
      .find({ templateId: stored._id }, { maxTimeMS: QUERY_TIME_MS })
      .sort({ at: -1 })
      .limit(5)
      .toArray();
    listed.push({
      template: toTemplateView(stored),
      reports: stored.reports,
      reasons: latest.map((report) => report.reason),
    });
  }
  return listed;
};
