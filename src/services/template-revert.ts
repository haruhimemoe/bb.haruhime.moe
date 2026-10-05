/**
 * @file src/services/template-revert.ts
 * @desc Restoring a template to an earlier revision. Owner only; the revert reruns the content
 *       rules through the store's `check`, so a revision whose name or body today's filter
 *       refuses can't be restored (400 with its code, nothing written). A revert to the current
 *       content is a no-op that answers the template as is.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import "server-only";
import { templateRevisions } from "@/lib/template-revisions";
import type { TemplateView } from "@/schemas/template-view";
import { authorOf, ensureHistory, writeLive } from "@/services/template-history";
import { contentRefusal, type Owner, ownedTemplate } from "@/services/templates-update";
import { type Answer, accept, NOT_FOUND, refuse } from "@/utils/answer";
import { toTemplateView } from "@/utils/template-view";

/**
 * @function revertTemplate
 * @param id {string} the template
 * @param viewer {Owner} the owner
 * @param revisionId {string} the revision to restore
 * @param now {Date} current time (tests)
 * @returns {Promise<Answer<TemplateView>>} the template at its restored content; 404 for an
 *          unknown revision; 400 when today's rules refuse the old content
 */
export const revertTemplate = async (
  id: string,
  viewer: Owner,
  revisionId: string,
  now: Date = new Date(),
): Promise<Answer<TemplateView>> => {
  const owned = await ownedTemplate(id, viewer);
  if (!owned.ok) return owned;
  const stored = owned.value;
  await ensureHistory(stored);
  let result: Awaited<ReturnType<typeof templateRevisions.revert>>;
  try {
    result = await templateRevisions.revert(id, revisionId, authorOf(viewer));
  } catch (error) {
    return contentRefusal(error);
  }
  if (result.status === "missing") {
    return refuse(404, "revision_not_found", "That revision doesn't exist.");
  }
  if (result.status === "unchanged") return accept(toTemplateView(stored));
  if (result.status !== "committed") {
    // revert never merges or conflicts: it writes the target's value outright.
    return refuse(
      409,
      "conflict",
      "This template changed since you opened it.",
      toTemplateView(stored),
    );
  }
  const next = await writeLive(stored, result.revision, {}, now);
  return next ? accept(toTemplateView(next)) : NOT_FOUND;
};
