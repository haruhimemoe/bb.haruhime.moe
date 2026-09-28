/**
 * @file src/utils/template-draft.ts
 * @desc The template form's working copy: what a new template starts as, a stored one's values
 *       to edit, a blank field (for a key the body already uses, labelled from the key), and the
 *       body the API takes (a new template's whole content; an edit's baseVersion and only what
 *       changed). Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { TemplateKind, Visibility } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";
import type { TemplateView } from "@/schemas/template-view";

/** What the form edits. */
export type TemplateDraft = {
  name: string;
  description: string;
  kind: TemplateKind;
  visibility: Visibility;
  body: string;
  fields: TemplateField[];
};

/** A new template's starting values. */
export const EMPTY_DRAFT: TemplateDraft = {
  name: "",
  description: "",
  kind: "userpage",
  visibility: "private",
  body: "",
  fields: [],
};

/**
 * @function draftOf
 * @param template {TemplateView} a stored template
 * @returns {TemplateDraft} its values, fields copied
 */
export const draftOf = (template: TemplateView): TemplateDraft => ({
  name: template.name,
  description: template.description,
  kind: template.kind,
  visibility: template.visibility,
  body: template.body,
  fields: template.fields.map((field) => ({ ...field })),
});

/**
 * @function labelFromKey
 * @param key {string} a field key like team_name or teamName
 * @returns {string} "Team name"
 */
export const labelFromKey = (key: string): string => {
  const words = key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * @function blankField
 * @param key {string} the field's key
 * @returns {TemplateField} a one-line text field, not required, with no default
 */
export const blankField = (key: string): TemplateField => ({
  key,
  label: labelFromKey(key) || key,
  kind: "text",
  required: false,
  default: "",
});

/**
 * @function nextFieldKey
 * @param fields {readonly TemplateField[]} the fields so far
 * @returns {string} field1, field2... the first one not taken
 */
export const nextFieldKey = (fields: readonly TemplateField[]): string => {
  const taken = new Set(fields.map((field) => field.key));
  let n = fields.length + 1;
  while (taken.has(`field${n}`)) n++;
  return `field${n}`;
};

/**
 * @function patchOf
 * @param saved {TemplateView} the template as last saved
 * @param draft {TemplateDraft} the form's values
 * @returns {Record<string, unknown>} baseVersion and every value that differs from the saved one
 */
export const patchOf = (saved: TemplateView, draft: TemplateDraft): Record<string, unknown> => {
  const before = draftOf(saved);
  const changed = (Object.keys(draft) as (keyof TemplateDraft)[]).filter(
    (key) => JSON.stringify(draft[key]) !== JSON.stringify(before[key]),
  );
  return {
    baseVersion: saved.version,
    ...Object.fromEntries(changed.map((key) => [key, draft[key]])),
  };
};
