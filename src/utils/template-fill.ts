/**
 * @file src/utils/template-fill.ts
 * @desc Filling a template's `{{key}}` placeholders, behind the same names
 *       @haruhimemoe/bbcode/template will export (fillTemplate, templateFields), so the next
 *       stage swaps this file's imports without touching callers. A declared field takes the
 *       typed value, or its default when nothing was typed; `user` becomes
 *       `[profile]name[/profile]`, `users` one such line per name, `country` its code in capitals,
 *       and every other kind the text as typed (one-line kinds trimmed). A placeholder no field
 *       declares stays as written, so the author sees it. Pure, and safe in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { FieldKind } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";

/** Typed values by field key. */
export type FieldValues = Readonly<Record<string, string>>;

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/**
 * @function placeholderKeys
 * @param body {string} a template's BBCode
 * @returns {string[]} every key its placeholders name, once each, in order of first use
 */
export const placeholderKeys = (body: string): string[] => [
  ...new Set([...body.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "")),
];

/**
 * @function templateFields
 * @param body {string} a template's BBCode
 * @param fields {readonly Pick<TemplateField, "key">[]} its declared fields
 * @returns {string[]} the keys its placeholders name that no field declares
 */
export const templateFields = (
  body: string,
  fields: readonly Pick<TemplateField, "key">[],
): string[] => {
  const declared = new Set(fields.map((field) => field.key));
  return placeholderKeys(body).filter((key) => !declared.has(key));
};

const profile = (name: string): string => `[profile]${name}[/profile]`;

/**
 * @function formatValue
 * @param kind {FieldKind} the field's kind
 * @param value {string} what was typed (or the default)
 * @returns {string} the BBCode that replaces the placeholder
 */
export const formatValue = (kind: FieldKind, value: string): string => {
  switch (kind) {
    case "multiline":
      return value;
    case "user":
      return value.trim() === "" ? "" : profile(value.trim());
    case "users":
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .map(profile)
        .join("\n");
    case "country":
      return value.trim().toUpperCase();
    default:
      return value.trim();
  }
};

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
 * @function fillTemplate
 * @param body {string} a template's BBCode
 * @param fields {readonly TemplateField[]} its declared fields
 * @param values {FieldValues} what was typed, by key
 * @returns {string} the body with every declared placeholder replaced
 */
export const fillTemplate = (
  body: string,
  fields: readonly TemplateField[],
  values: FieldValues,
): string => {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  return body.replace(PLACEHOLDER, (whole, key: string) => {
    const field = byKey.get(key);
    return field ? formatValue(field.kind, fieldValue(field, values)) : whole;
  });
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
