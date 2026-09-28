/**
 * @file src/schemas/template.ts
 * @desc A template, as people send it and as templates stores it. Content: name (3 to 80, one
 *       line), description (up to 280, one line), kind, body (1 to 60,000 characters, at least
 *       one that isn't a space) and fields, every text through the content filter; plus
 *       visibility. Stored rows add the owner (osu! id and name), forkOf (the template it was
 *       forked from, or null), the uses and reports counters, hidden (3 reports on a public
 *       template), createdAt, updatedAt and version (1, then up by one per change). Writes check
 *       the whole content schema; reads use templateReadSchema, shape only, so a template a
 *       newer filter refuses still reads (and can be renamed or deleted).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { z } from "zod";
import {
  BODY_MAX,
  DESCRIPTION_MAX,
  NAME_MAX,
  NAME_MIN,
  TEMPLATE_KINDS,
  VISIBILITIES,
} from "@/constants/templates";
import { templateFieldShape, templateFieldsSchema } from "@/schemas/template-field";
import { multiLineText, oneLineText } from "@/schemas/text";

/** What a template holds, checked in full on every write. */
export const templateContentSchema = z.strictObject({
  name: oneLineText("name", NAME_MIN, NAME_MAX),
  description: oneLineText("description", 0, DESCRIPTION_MAX),
  kind: z.enum(TEMPLATE_KINDS, { error: "Pick what the template is for." }),
  body: multiLineText("body", BODY_MAX).refine(
    (body) => body.trim() !== "",
    "Write the template's BBCode first.",
  ),
  fields: templateFieldsSchema,
});

/** A template's content. */
export type TemplateContent = z.output<typeof templateContentSchema>;

/** POST /api/templates: the content and who sees it (private unless given). */
export const createBodySchema = templateContentSchema.extend({
  visibility: z.enum(VISIBILITIES).default("private"),
});

/** PATCH /api/templates/<id>: the version it's based on and any content or visibility. */
export const patchBodySchema = templateContentSchema
  .partial()
  .extend({
    baseVersion: z.number().int().min(1),
    visibility: z.enum(VISIBILITIES).optional(),
  })
  .refine(
    ({ baseVersion: _, ...change }) => Object.values(change).some((value) => value !== undefined),
    "Nothing to change.",
  );

/** A PATCH body. */
export type TemplatePatch = z.output<typeof patchBodySchema>;

/** A stored template, by shape only. */
export const templateReadSchema = z.object({
  _id: z.string(),
  ownerOsuId: z.number().int(),
  ownerName: z.string(),
  name: z.string(),
  description: z.string(),
  kind: z.enum(TEMPLATE_KINDS),
  body: z.string(),
  fields: z.array(templateFieldShape),
  visibility: z.enum(VISIBILITIES),
  forkOf: z.string().nullable(),
  uses: z.number().int(),
  reports: z.number().int(),
  hidden: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().int(),
});

/** A row in templates. */
export type StoredTemplate = z.output<typeof templateReadSchema>;
