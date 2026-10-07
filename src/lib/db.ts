/**
 * @file src/lib/db.ts
 * @desc bb's MongoDB, from next-kit's createMongo: one MongoClient per process, built on first
 *       use (never at import, so builds and pages without a database need no env), Mongoose on
 *       the same client, state on globalThis so dev reloads don't leak clients, and a failed
 *       connect never cached. The database is always "bb", whatever the URI says; the hub's
 *       "identity" database (users and sessions) sits on the same client, read-only for bb's
 *       Atlas user, so bb never builds an index there. The first connect builds bb's raw
 *       indexes (src/lib/db-indexes.ts); the templates' own indexes live on their Mongoose
 *       schema (src/models/Template.ts).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import "server-only";
import { createMongo } from "@haruhimemoe/next-kit/mongo";
import { getDatabaseUri } from "@/env";
import { ensureIndexes } from "@/lib/db-indexes";

/** The one database bb uses. */
export const DB_NAME = "bb";

/** The hub's identity database: bb reads sessions and users there, never writes. */
export const IDENTITY_DB_NAME = "identity";

const mongo = createMongo({
  dbName: DB_NAME,
  identityDbName: IDENTITY_DB_NAME,
  globalKey: "__bbMongo",
  uri: getDatabaseUri,
  // bb's own indexes only: bb's Atlas user can't write identity, the hub owns its indexes.
  onConnect: async ({ db }) => {
    await ensureIndexes(db);
  },
});

/** The shared client (connects lazily on first operation). */
export const getMongoClient = mongo.getMongoClient;

/** The bb database on the shared client. */
export const getDb = mongo.getDb;

/** The hub's identity database on the shared client (read-only). */
export const getIdentityDb = mongo.getIdentityDb;

/** The Mongoose connection models register on (usable after connectDb). */
export const getModelConnection = mongo.getModelConnection;

/** Connects once: Mongoose attached and the raw indexes built. */
export const connectDb = mongo.connectDb;

/** The bb database once connectDb has resolved. */
export const connectedDb = mongo.connectedDb;

/** Closes the client and forgets it (tests). */
export const closeDb = mongo.closeDb;
