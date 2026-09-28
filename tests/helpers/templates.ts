/**
 * @file tests/helpers/templates.ts
 * @desc Template rows and bodies for tests: a valid create body, a stored row with any field
 *       changed, and inserting one straight into the database.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { templatesCollection } from "@/models/Template";
import type { StoredTemplate } from "@/schemas/template";

/** A body POST /api/templates accepts. */
export const validBody = (overrides: Record<string, unknown> = {}) => ({
  name: "My userpage",
  description: "A short one.",
  kind: "userpage",
  body: "[b]Hi, I'm {{name}}[/b]",
  fields: [{ key: "name", label: "Name", kind: "text", required: true, default: "" }],
  ...overrides,
});

let next = 0;

/**
 * @function makeTemplate
 * @param overrides {Partial<StoredTemplate>} fields to change
 * @returns {StoredTemplate} a public template owned by osu! id 10
 */
export const makeTemplate = (overrides: Partial<StoredTemplate> = {}): StoredTemplate => {
  next += 1;
  const at = new Date("2026-09-01T00:00:00Z");
  return {
    _id: `t-${String(next).padStart(8, "0")}`,
    ownerOsuId: 10,
    ownerName: "owner",
    name: `Template ${next}`,
    description: "",
    kind: "userpage",
    body: "[b]hello[/b]",
    fields: [],
    visibility: "public",
    forkOf: null,
    uses: 0,
    reports: 0,
    hidden: false,
    createdAt: at,
    updatedAt: at,
    version: 1,
    ...overrides,
  };
};

/**
 * @function insertTemplate
 * @param overrides {Partial<StoredTemplate>} fields to change
 * @returns {Promise<StoredTemplate>} the stored row
 */
export const insertTemplate = async (
  overrides: Partial<StoredTemplate> = {},
): Promise<StoredTemplate> => {
  const row = makeTemplate(overrides);
  await (await templatesCollection()).insertOne(row);
  return row;
};
