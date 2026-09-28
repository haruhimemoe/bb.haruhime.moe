/**
 * @file src/utils/template-view.ts
 * @desc Turns a stored template into the plain JSON pages and API answers send (dates as ISO
 *       text, no report count), and names a fork. Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { NAME_MAX } from "@/constants/templates";
import type { StoredTemplate } from "@/schemas/template";
import type { TemplateView } from "@/schemas/template-view";

/**
 * @function toTemplateView
 * @param template {StoredTemplate} a row from templates
 * @returns {TemplateView} what the browser gets
 */
export const toTemplateView = (template: StoredTemplate): TemplateView => ({
  id: template._id,
  builtIn: false,
  ownerOsuId: template.ownerOsuId,
  ownerName: template.ownerName,
  name: template.name,
  description: template.description,
  kind: template.kind,
  body: template.body,
  fields: template.fields,
  visibility: template.visibility,
  forkOf: template.forkOf,
  uses: template.uses,
  hidden: template.hidden,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
  version: template.version,
});

const FORK_SUFFIX = " (copy)";

/**
 * @function forkName
 * @param name {string} the original's name
 * @returns {string} it with " (copy)", the name cut so the whole stays within NAME_MAX
 */
export const forkName = (name: string): string => {
  let kept = "";
  // By code point, so a cut never splits a surrogate pair; length counts UTF-16 as zod does.
  for (const char of name) {
    if (kept.length + char.length > NAME_MAX - FORK_SUFFIX.length) break;
    kept += char;
  }
  return `${kept.trimEnd()}${FORK_SUFFIX}`;
};
