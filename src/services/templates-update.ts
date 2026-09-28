/**
 * @file src/services/templates-update.ts
 * @desc Changing and deleting a template, owner only. A change names the version it's based on:
 *       one guarded write matches that version and bumps it, so a change made meanwhile (in
 *       another tab) is a 409 carrying the template as it is now, never overwritten. It $sets
 *       only the content, visibility, hidden and updatedAt; hidden stays set once reports set
 *       it (only an admin clears it), and becoming public with enough reports sets it. Built-in
 *       templates are refused; a template the caller can't see is a 404, one they see but don't
 *       own a 403. Deleting also deletes its reports.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { REPORTS_TO_HIDE } from "@/constants/templates";
import { templateReportsCollection, templatesCollection } from "@/models/Template";
import type { StoredTemplate, TemplatePatch } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";
import { type Answer, accept, BUILT_IN, NOT_FOUND, NOT_OWNER, refuse } from "@/utils/answer";
import { canView, isOwner, shouldHide, type Viewer } from "@/utils/template-access";
import { isBuiltinId } from "@/utils/template-ids";
import { toTemplateView } from "@/utils/template-view";
import { findStoredTemplate } from "./templates-read";

/** The 409 message: someone changed it first. */
export const STALE_VERSION =
  "This template changed since you opened it. It's reloaded; your change wasn't saved.";

/**
 * @function ownedTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer>} the caller
 * @returns {Promise<Answer<StoredTemplate>>} the row when the caller owns it, else the refusal
 */
export const ownedTemplate = async (
  id: string,
  viewer: NonNullable<Viewer>,
): Promise<Answer<StoredTemplate>> => {
  if (isBuiltinId(id)) return BUILT_IN;
  const stored = await findStoredTemplate(id);
  if (!stored || !canView(stored, viewer)) return NOT_FOUND;
  return isOwner(stored, viewer) ? accept(stored) : NOT_OWNER;
};

/**
 * @function updateTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer>} the caller
 * @param patch {TemplatePatch} the base version and what changes
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the changed template, or a refusal (409 with the
 *          current one)
 */
export const updateTemplate = async (
  id: string,
  viewer: NonNullable<Viewer>,
  { baseVersion, ...change }: TemplatePatch,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  const stale = () => refuse(409, "conflict", STALE_VERSION, toTemplateView(stored));
  if (stored.version !== baseVersion) return stale();
  const defined = Object.fromEntries(
    Object.entries(change).filter(([, value]) => value !== undefined),
  ) as Partial<StoredTemplate>;
  const visibility = defined.visibility ?? stored.visibility;
  const hidden = stored.hidden || shouldHide(visibility, stored.reports, REPORTS_TO_HIDE);
  const templates = await templatesCollection();
  const next = await templates.findOneAndUpdate(
    { _id: id, ownerOsuId: viewer.osuId, version: baseVersion },
    { $set: { ...defined, hidden, updatedAt: now }, $inc: { version: 1 } },
    { returnDocument: "after" },
  );
  if (next) return accept(toTemplateView(next));
  // Changed (or deleted) between the read and the write.
  const current = await findStoredTemplate(id);
  if (!current) return NOT_FOUND;
  return refuse(409, "conflict", STALE_VERSION, toTemplateView(current));
};

/**
 * @function deleteTemplate
 * @param id {string} the template id
 * @param viewer {NonNullable<Viewer>} the caller
 * @returns {Promise<Answer<null>>} null once it and its reports are gone, or a refusal
 */
export const deleteTemplate = async (
  id: string,
  viewer: NonNullable<Viewer>,
): Promise<Answer<null>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const templates = await templatesCollection();
  const { deletedCount } = await templates.deleteOne({ _id: id, ownerOsuId: viewer.osuId });
  if (deletedCount === 0) return NOT_FOUND;
  await (await templateReportsCollection()).deleteMany({ templateId: id });
  return accept(null);
};
