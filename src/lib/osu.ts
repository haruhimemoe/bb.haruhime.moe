/**
 * @file src/lib/osu.ts
 * @desc bb's osu! API access on the server, with its app's client credentials (OSU_CLIENT_ID,
 *       OSU_CLIENT_SECRET, the same app people sign in with), read on first use. getOsuClient is
 *       @haruhimemoe/osu's client (users for the player list; beatmaps and star ratings for pool
 *       import); OsuApiError is its error. osuBudget is next-kit's createBudget over rate_limits:
 *       every osu! call takes one from a global 50 a minute and the caller's 20; its gate says no
 *       for the rest of a request after its first no.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { type Budget, createBudget } from "@haruhimemoe/next-kit/server";
import { createOsuClient, type OsuClient } from "@haruhimemoe/osu";
import { RATE_LIMITS_COLLECTION } from "@/constants/db";
import { OSU_API_BUDGET, OSU_API_BUDGET_PER_IP } from "@/constants/osu";
import { SERVER_USER_AGENT } from "@/constants/site";
import { getServerEnv } from "@/env";
import { connectedDb } from "@/lib/db";

/** The error for every failure talking to osu!. */
export { OsuApiError } from "@haruhimemoe/osu";

let client: OsuClient | undefined;

/**
 * @function osuCredentials
 * @returns {{ clientId: string; clientSecret: string }} the app's id and secret, read now
 */
const osuCredentials = (): { clientId: string; clientSecret: string } => {
  const env = getServerEnv();
  return { clientId: env.OSU_CLIENT_ID, clientSecret: env.OSU_CLIENT_SECRET };
};

/**
 * @function getOsuClient
 * @returns {OsuClient} the process-wide client (its token is cached on it)
 */
export const getOsuClient = (): OsuClient => {
  client ??= createOsuClient({ userAgent: SERVER_USER_AGENT, credentials: osuCredentials });
  return client;
};

/** The osu! call budget every request shares: `gate(subject)` is a request's beforeCall. */
export const osuBudget: Budget = createBudget({
  db: connectedDb,
  collection: RATE_LIMITS_COLLECTION,
  global: OSU_API_BUDGET,
  globalSubject: OSU_API_BUDGET.subject,
  perSubject: OSU_API_BUDGET_PER_IP,
});
