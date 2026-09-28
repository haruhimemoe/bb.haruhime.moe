/**
 * @file src/lib/db-indexes.ts
 * @desc Indexes on collections Mongoose doesn't manage, built with next-kit's ensureIndexes (each
 *       on its own, logged and skipped when it can't build, never thrown): better-auth's (one
 *       user per osu! id, one account per osu! link, one session per token, sessions by user,
 *       and the session TTL), the TTL on rate-limit counters, and template_reports' (one report
 *       per reporter per template, and reports by reporter for account deletion). The
 *       templates' indexes live on their Mongoose schema (src/models/Template.ts), since one of
 *       them is a text index.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { AUTH_INDEX_SPECS } from "@haruhimemoe/next-kit/auth";
import { ensureIndexes as buildIndexes, type IndexSpec } from "@haruhimemoe/next-kit/mongo";
import { counterTtlIndex } from "@haruhimemoe/next-kit/server";
import type { Db } from "mongodb";
import {
  RATE_LIMITS_COLLECTION,
  TEMPLATE_REPORT_INDEXES,
  TEMPLATE_REPORTS_COLLECTION,
} from "@/constants/db";

/** Every index connectDb makes sure of on collections without a Mongoose schema. */
export const RAW_INDEXES: readonly IndexSpec[] = [
  ...AUTH_INDEX_SPECS,
  counterTtlIndex(RATE_LIMITS_COLLECTION),
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
