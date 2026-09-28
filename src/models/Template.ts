/**
 * @file src/models/Template.ts
 * @desc The templates collection's Mongoose schema: the fields a template holds
 *       (src/schemas/template.ts is the zod shape) and its indexes, by the names
 *       src/constants/db.ts gives them: owner with updatedAt (your templates, the per-owner
 *       count), visibility with updatedAt (the gallery's Newest), visibility with uses (Most
 *       used), a text index on name and description (search), and hidden (moderation).
 *       templatesCollection() hands out the typed driver collection once the indexes exist;
 *       templateReportsCollection() and builtinUsesCollection() the other two. Registered
 *       lazily on the shared connection.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import type { Collection } from "mongodb";
import { type Model, Schema } from "mongoose";
import {
  BUILTIN_USES_COLLECTION,
  TEMPLATE_INDEXES,
  TEMPLATE_REPORTS_COLLECTION,
  TEMPLATES_COLLECTION,
} from "@/constants/db";
import { connectDb, getDb, getModelConnection } from "@/lib/db";
import type { StoredTemplate } from "@/schemas/template";

// Validation is zod's job; the schema documents the fields and owns the indexes. Writes go
// through the driver with whole, zod-shaped values.
const templateSchema = new Schema(
  {
    _id: { type: String, required: true },
    ownerOsuId: { type: Number, required: true },
    ownerName: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    kind: { type: String, required: true },
    body: { type: String, required: true },
    fields: { type: [Schema.Types.Mixed], default: [] },
    visibility: { type: String, required: true },
    forkOf: { type: String, default: null },
    uses: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    version: { type: Number, required: true },
  },
  { collection: TEMPLATES_COLLECTION, versionKey: false },
);

templateSchema.index({ ownerOsuId: 1, updatedAt: -1 }, { name: TEMPLATE_INDEXES.owner });
templateSchema.index({ visibility: 1, updatedAt: -1 }, { name: TEMPLATE_INDEXES.listedRecent });
templateSchema.index({ visibility: 1, uses: -1 }, { name: TEMPLATE_INDEXES.listedUses });
templateSchema.index(
  { name: "text", description: "text" },
  { name: TEMPLATE_INDEXES.text, weights: { name: 3, description: 1 } },
);
templateSchema.index({ hidden: 1 }, { name: TEMPLATE_INDEXES.hidden });

/**
 * @function getTemplateModel
 * @returns {Model<StoredTemplate>} the Template model on the shared connection (registered once)
 */
export const getTemplateModel = (): Model<StoredTemplate> => {
  const connection = getModelConnection();
  return (
    (connection.models.Template as Model<StoredTemplate> | undefined) ??
    connection.model<StoredTemplate>("Template", templateSchema)
  );
};

/**
 * @function templatesCollection
 * @returns {Promise<Collection<StoredTemplate>>} templates once connected and indexed
 */
export const templatesCollection = async (): Promise<Collection<StoredTemplate>> => {
  await connectDb();
  await getTemplateModel().init();
  return getDb().collection<StoredTemplate>(TEMPLATES_COLLECTION);
};

/** One report: who reported which template, why and when. */
export type StoredReport = { templateId: string; reporterOsuId: number; reason: string; at: Date };

/**
 * @function templateReportsCollection
 * @returns {Promise<Collection<StoredReport>>} template_reports once connected
 */
export const templateReportsCollection = async (): Promise<Collection<StoredReport>> => {
  await connectDb();
  return getDb().collection<StoredReport>(TEMPLATE_REPORTS_COLLECTION);
};

/** How often one built-in template was used. */
export type BuiltinUses = { _id: string; uses: number };

/**
 * @function builtinUsesCollection
 * @returns {Promise<Collection<BuiltinUses>>} builtin_template_uses once connected
 */
export const builtinUsesCollection = async (): Promise<Collection<BuiltinUses>> => {
  await connectDb();
  return getDb().collection<BuiltinUses>(BUILTIN_USES_COLLECTION);
};
