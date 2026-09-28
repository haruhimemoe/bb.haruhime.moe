/**
 * @file src/utils/template-fill.ts
 * @desc Filling a template's `{{key}}` placeholders: fillTemplate and templateFields come straight
 *       from @haruhimemoe/bbcode/template (each kind checked and written the osu! way: `user` a
 *       [profile] link, `users` one per line, `country` a flag image, `color` normalized; a field
 *       with an error, and a placeholder no field declares, stay as `{{key}}`). The fill-in
 *       form's own helpers (a field's value or default, the required fields still blank) live
 *       here. Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { TemplateField } from "@/schemas/template-field";

/** The package's fill and placeholder check, under the names callers import from here. */
export { fillTemplate, templateFields } from "@haruhimemoe/bbcode/template";

/** Typed values by field key. */
export type FieldValues = Readonly<Record<string, string>>;

/**
 * @function fieldValue
 * @param field {TemplateField} a declared field
 * @param values {FieldValues} what was typed
 * @returns {string} the typed value, or the default when it's missing or blank
 */
export const fieldValue = (field: TemplateField, values: FieldValues): string => {
  const typed = values[field.key];
  return typed === undefined || typed.trim() === "" ? field.default : typed;
};

/**
 * @function missingRequired
 * @param fields {readonly TemplateField[]} the declared fields
 * @param values {FieldValues} what was typed
 * @returns {string[]} the labels of required fields left blank with no default
 */
export const missingRequired = (fields: readonly TemplateField[], values: FieldValues): string[] =>
  fields
    .filter((field) => field.required && fieldValue(field, values).trim() === "")
    .map((field) => field.label);
