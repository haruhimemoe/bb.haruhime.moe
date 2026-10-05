/**
 * @file src/utils/template-history-access.ts
 * @desc Who may read and revert a person's template's history. The owner always; anyone else
 *       reads only a public history of an unlisted or public template that isn't hidden; admins
 *       read any non-private template's history, hidden or not, but never revert or toggle (only
 *       the owner can). Built-in templates have no history. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { StoredTemplate } from "@/schemas/template";
import { isOwner, type Viewer } from "@/utils/template-access";

/** The parts of a template history access reads. */
export type HistoryGuarded = Pick<
  StoredTemplate,
  "ownerOsuId" | "visibility" | "hidden" | "historyPublic"
>;

/** What a caller may do with a template's history. */
export type TemplateHistoryAccess = { canRead: boolean; canEdit: boolean };

/**
 * @function templateHistoryAccessOf
 * @param template {HistoryGuarded} a person's template
 * @param viewer {Viewer} who asks
 * @returns {TemplateHistoryAccess} the owner reads and reverts; anyone else reads only a public
 *          history of an unlisted or public template that isn't hidden (admins read any
 *          non-private template's history, hidden or not, but never revert)
 */
export const templateHistoryAccessOf = (
  template: HistoryGuarded,
  viewer: Viewer,
): TemplateHistoryAccess => {
  const owner = isOwner(template, viewer);
  const notPrivate = template.visibility !== "private";
  const open = template.historyPublic === true && notPrivate && !template.hidden;
  const moderator = viewer?.isAdmin === true && notPrivate;
  return { canRead: owner || moderator || open, canEdit: owner };
};
