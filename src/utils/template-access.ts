/**
 * @file src/utils/template-access.ts
 * @desc Who may do what with a person's template. The owner sees and edits it whatever its
 *       visibility or moderation. Anyone sees an unlisted or public template that reports
 *       haven't hidden; admins also see hidden ones (to clear them), never private ones, and
 *       never edit. Anyone signed in may report a template they can see and don't own. Built-in
 *       templates are outside these rules: everyone sees them and nobody edits them. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { StoredTemplate } from "@/schemas/template";

/** Who is asking: an osu! id and admin flag, or null for a visitor. */
export type Viewer = { osuId: number; isAdmin: boolean } | null;

type Guarded = Pick<StoredTemplate, "ownerOsuId" | "visibility" | "hidden">;

/**
 * @function isOwner
 * @param template {Guarded} the template
 * @param viewer {Viewer} who asks
 * @returns {boolean} true when the viewer owns it
 */
export const isOwner = (template: Guarded, viewer: Viewer): boolean =>
  viewer !== null && viewer.osuId === template.ownerOsuId;

/**
 * @function canView
 * @param template {Guarded} the template
 * @param viewer {Viewer} who asks
 * @returns {boolean} owner always; admins anything not private; anyone else an unlisted or
 *          public template that isn't hidden
 */
export const canView = (template: Guarded, viewer: Viewer): boolean => {
  if (isOwner(template, viewer)) return true;
  if (template.visibility === "private") return false;
  return !template.hidden || viewer?.isAdmin === true;
};

/**
 * @function canReport
 * @param template {Guarded} the template
 * @param viewer {Viewer} who asks
 * @returns {boolean} signed in, not the owner, and able to see it
 */
export const canReport = (template: Guarded, viewer: Viewer): boolean =>
  viewer !== null && !isOwner(template, viewer) && canView(template, viewer);

/**
 * @function shouldHide
 * @param visibility {StoredTemplate["visibility"]} the template's visibility
 * @param reports {number} its reports since an admin last cleared it
 * @param threshold {number} reports that hide a public template
 * @returns {boolean} true when it's public and has reached the threshold
 */
export const shouldHide = (
  visibility: StoredTemplate["visibility"],
  reports: number,
  threshold: number,
): boolean => visibility === "public" && reports >= threshold;
