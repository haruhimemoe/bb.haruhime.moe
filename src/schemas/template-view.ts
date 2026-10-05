/**
 * @file src/schemas/template-view.ts
 * @desc What pages, components and API answers get for a template: plain JSON (dates as ISO
 *       text), a built-in flag, and the moderation fields only where the viewer may see them.
 *       Types and the report body only, so components and services share them without
 *       importing each other.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { z } from "zod";
import type { TemplateKind, Visibility } from "@/constants/templates";
import { REPORT_REASON_MAX } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";
import { wellFormed } from "@/schemas/text";

/** A template as the browser sees it. */
export type TemplateView = {
  id: string;
  /** Built-in templates live in the repo: they can be used and forked, never edited. */
  builtIn: boolean;
  /** null for a built-in template. */
  ownerOsuId: number | null;
  ownerName: string | null;
  name: string;
  description: string;
  kind: TemplateKind;
  body: string;
  fields: TemplateField[];
  visibility: Visibility;
  forkOf: string | null;
  uses: number;
  /** Hidden by reports: only its owner and admins see it, with a notice. */
  hidden: boolean;
  /** ISO text; null for a built-in template. */
  createdAt: string | null;
  updatedAt: string | null;
  version: number;
  /** The revision this content matches; null for a built-in template or one not read yet. */
  head: { id: string; seq: number } | null;
  /** Whether anyone who can see the template may also read its history. */
  historyPublic: boolean;
};

/**
 * POST /api/templates/<id>/report: why, one line of 3 to REPORT_REASON_MAX characters. Only
 * admins read it, and a report may need to quote what it reports, so it skips the filter.
 */
export const reportBodySchema = z.strictObject({
  reason: z
    .string()
    .trim()
    .min(3, "Say why in a few words.")
    .max(REPORT_REASON_MAX, `Keep the reason to ${REPORT_REASON_MAX} characters.`)
    .regex(/^[^\p{Cc}\u2028\u2029]*$/u, "The reason can't have line breaks.")
    .refine(wellFormed, "The reason has a broken character."),
});

/** DELETE /api/account: the caller's osu! username, typed to confirm. */
export const accountDeleteBodySchema = z.strictObject({
  username: z.string().trim().max(64),
});
