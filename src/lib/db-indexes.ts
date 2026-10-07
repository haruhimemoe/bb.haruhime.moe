/**
 * @file src/lib/db-indexes.ts
 * @desc Indexes on collections Mongoose doesn't manage, built with next-kit's ensureIndexes (each
 *       on its own, logged and skipped when it can't build, never thrown): the TTL on rate-limit counters and on the osu! caches (osu_users,
 *       osu_beatmaps: each row's expiresAt), template_reports' (one report
 *       per reporter per template, and reports by reporter for account deletion), and api_keys'
 *       (next-kit's apiKeyIndexSpecs). The templates' indexes live on their Mongoose schema
 *       (src/models/Template.ts), since one of them is a text index.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import "server-only";
import { apiKeyIndexSpecs } from "@haruhimemoe/next-kit/api-keys";
import { ensureIndexes as buildIndexes, type IndexSpec } from "@haruhimemoe/next-kit/mongo";
import { counterTtlIndex } from "@haruhimemoe/next-kit/server";
import { revisionIndexSpecs } from "@haruhimemoe/next-kit/vcs";
import type { Db } from "mongodb";
import {
  OSU_BEATMAPS_COLLECTION,
  OSU_USERS_COLLECTION,
  RATE_LIMITS_COLLECTION,
  TEMPLATE_REPORT_INDEXES,
  TEMPLATE_REPORTS_COLLECTION,
  TEMPLATE_REVISIONS_COLLECTION,
} from "@/constants/db";

/** Every index connectDb makes sure of on collections without a Mongoose schema. */
export const RAW_INDEXES: readonly IndexSpec[] = [
  counterTtlIndex(RATE_LIMITS_COLLECTION),
  {
    collection: OSU_USERS_COLLECTION,
    key: { expiresAt: 1 },
    name: "expiresAt_ttl",
    expireAfterSeconds: 0,
  },
  {
    collection: OSU_BEATMAPS_COLLECTION,
    key: { expiresAt: 1 },
    name: "expiresAt_ttl",
    expireAfterSeconds: 0,
  },
  {
    collection: TEMPLATE_REPORTS_COLLECTION,
    key: { templateId: 1, reporterOsuId: 1 },
    name: TEMPLATE_REPORT_INDEXES.unique,
    unique: true,
  },
  {
    collection: TEMPLATE_REPORTS_COLLECTION,
    key: { reporterOsuId: 1 },
    name: TEMPLATE_REPORT_INDEXES.reporter,
  },
  ...revisionIndexSpecs(TEMPLATE_REVISIONS_COLLECTION),
  ...apiKeyIndexSpecs(),
];

/**
 * @function ensureIndexes
 * @param db {Db} the bb database
 * @returns {Promise<void>} every index built, or skipped and logged (never thrown): a missing
 *          index must not take the site or sign-in down
 */
export const ensureIndexes = async (db: Db): Promise<void> => {
  await buildIndexes(db, RAW_INDEXES);
};
