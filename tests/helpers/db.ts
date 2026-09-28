/**
 * @file tests/helpers/db.ts
 * @desc setupTestDb(): next-kit's per-file database hooks with bb's connect, database and
 *       collections (ours plus better-auth's): each test starts with every collection empty, and
 *       the client closes after the file.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { BETTER_AUTH_COLLECTIONS, setupTestDb as setupKitDb } from "@haruhimemoe/next-kit/testing";
import { closeDb, connectDb, getDb } from "@/lib/db";

/** Every collection bb writes. */
const COLLECTIONS = [
  "templates",
  "template_reports",
  "builtin_template_uses",
  "rate_limits",
  "osu_users",
  "osu_beatmaps",
  ...BETTER_AUTH_COLLECTIONS,
];

/**
 * @function setupTestDb
 * @returns {void} registers beforeEach (connect, then clear) and afterAll (close) hooks
 */
export const setupTestDb = (): void =>
  setupKitDb({ connect: connectDb, db: getDb, close: closeDb, collections: COLLECTIONS });
