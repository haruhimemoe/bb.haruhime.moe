/**
 * @file src/lib/auth.ts
 * @desc better-auth for every osu! user, built on first use by @haruhimemoe/next-kit/auth's
 *       createOsuAuth (MongoDB on the shared client, osu! OAuth with PKCE, osu! trusted for
 *       account linking, no osu! tokens kept, errors to /signin?error=<code>, and the readable
 *       SIGNED_IN_COOKIE marker following the session). Anyone with an osu! account can sign in
 *       (to save templates); admin rights come only from ADMIN_OSU_IDS, read on every request
 *       by getUserFromHeaders, so a removed id stops being an admin at once.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { createOsuAuth, getOsuUser } from "@haruhimemoe/next-kit/auth";
import { SIGNED_IN_COOKIE } from "@/constants/site";
import { getServerEnv } from "@/env";
import { isAdminOsuId } from "@/lib/admin";
import { connectDb, getDb, getMongoClient } from "@/lib/db";
import type { AdminUser, SessionUser } from "@/schemas/session-user";

const createAuth = () => {
  const env = getServerEnv();
  return createOsuAuth({
    clientId: env.OSU_CLIENT_ID,
    clientSecret: env.OSU_CLIENT_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    db: getDb(),
    client: getMongoClient(),
    markerCookie: SIGNED_IN_COOKIE,
  });
};

/** The better-auth instance's type, for the client's inferAdditionalFields. */
export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | null = null;

/**
 * @function getAuth
 * @returns {Auth} the process-wide better-auth instance, built on first use
 */
export const getAuth = (): Auth => {
  instance ??= createAuth();
  return instance;
};

/**
 * @function getUserFromHeaders
 * @param headers {Headers} request headers (the session cookie)
 * @returns {Promise<SessionUser | null>} the signed-in user, or null
 */
export const getUserFromHeaders = async (headers: Headers): Promise<SessionUser | null> => {
  await connectDb();
  const user = await getOsuUser(getAuth(), headers);
  return user ? { ...user, isAdmin: isAdminOsuId(user.osuId) } : null;
};

/**
 * @function getAdminFromHeaders
 * @param headers {Headers} request headers
 * @returns {Promise<AdminUser | null>} the signed-in admin, or null (signed out, or signed in
 *          without an id in ADMIN_OSU_IDS)
 */
export const getAdminFromHeaders = async (headers: Headers): Promise<AdminUser | null> => {
  const user = await getUserFromHeaders(headers);
  if (!user?.isAdmin) return null;
  const { isAdmin: _, ...admin } = user;
  return admin;
};
