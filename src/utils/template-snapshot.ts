/**
 * @file src/utils/template-snapshot.ts
 * @desc What a template's history keeps: its content (name, description, kind, body, fields) as
 *       plain JSON, nothing about who sees it. TEMPLATE_CODEC keys fields by their key (unique
 *       within a template) and merges the body line by line. forkRefOf reads a row's `forkOf`,
 *       which is a bare template id for a row made before fork refs, or `{ docId, rev }` since.
 *       Pure.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { type Codec, defineCodec } from "@haruhimemoe/vcs/json";
import type { StoredTemplate, TemplateContent } from "@/schemas/template";
import type { TemplateField } from "@/schemas/template-field";

/** A template as one revision holds it: its content, nothing about who sees it. */
export type TemplateSnapshot = TemplateContent;

/** Fields keyed by their key; the body merges line by line. */
export const TEMPLATE_CODEC: Codec = defineCodec({
  lists: { fields: (field: TemplateField) => field.key },
  text: ["body"],
});

/**
 * @function snapshotOf
 * @param template {TemplateContent} a template (or a row: only the content is copied)
 * @returns {TemplateSnapshot} its history snapshot (a fresh JSON copy)
 */
export const snapshotOf = (template: TemplateContent): TemplateSnapshot => ({
  name: template.name,
  description: template.description,
  kind: template.kind,
  body: template.body,
  fields: structuredClone(template.fields),
});

/** Where a fork came from: the template, and the upstream revision it last took in. */
export type ForkRef = { docId: string; rev: string | null };

/**
 * @function forkRefOf
 * @param stored {StoredTemplate["forkOf"]} the row's forkOf (a bare id from before history, a
 *        ref, or null)
 * @returns {ForkRef | null} the ref (rev null when unknown), or null for a template that isn't a
 *          fork
 */
export const forkRefOf = (stored: StoredTemplate["forkOf"]): ForkRef | null =>
  stored === null
    ? null
    : typeof stored === "string"
      ? { docId: stored, rev: null }
      : (stored as ForkRef);
