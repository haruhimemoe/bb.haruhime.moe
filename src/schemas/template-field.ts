/**
 * @file src/schemas/template-field.ts
 * @desc A template's field declarations, as @haruhimemoe/bbcode/template will take them:
 *       `{ key, label, kind, required, default }`. The key is what `{{key}}` names in the body
 *       (a letter, then letters, digits and underscores, up to 32); the label is one line up to
 *       60 characters; kind is one of FIELD_KINDS; default is the value the form starts with
 *       (multi-line, up to 2000). Labels and defaults go through the content filter too, since
 *       they show on the template's public page. Keys are unique, at most MAX_FIELDS.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { z } from "zod";
import {
  FIELD_DEFAULT_MAX,
  FIELD_KEY_PATTERN,
  FIELD_KINDS,
  FIELD_LABEL_MAX,
  MAX_FIELDS,
} from "@/constants/templates";
import { multiLineText, oneLineText } from "@/schemas/text";

/** One field declaration. */
export const templateFieldSchema = z.strictObject({
  key: z
    .string()
    .regex(
      FIELD_KEY_PATTERN,
      "A field key starts with a letter and has only letters, digits and underscores (up to 32).",
    ),
  label: oneLineText("field label", 1, FIELD_LABEL_MAX),
  kind: z.enum(FIELD_KINDS, { error: "Pick a kind for the field." }),
  required: z.boolean(),
  default: multiLineText("field default", FIELD_DEFAULT_MAX),
});

/** A field declaration. */
export type TemplateField = z.output<typeof templateFieldSchema>;

/** A template's fields: at most MAX_FIELDS, every key once. */
export const templateFieldsSchema = z
  .array(templateFieldSchema)
  .max(MAX_FIELDS, `A template can have at most ${MAX_FIELDS} fields.`)
  .refine(
    (fields) => new Set(fields.map((field) => field.key)).size === fields.length,
    "Two fields have the same key.",
  );

/** The same fields by shape only (reads, and built-in templates' front matter). */
export const templateFieldShape = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(FIELD_KINDS),
  required: z.boolean(),
  default: z.string(),
});
