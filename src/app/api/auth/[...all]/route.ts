/**
 * @file src/app/api/auth/[...all]/route.ts
 * @desc better-auth handler: sign-in, OAuth callback, session, sign-out under /api/auth/*.
 *       Connects first, so the indexes exist before better-auth touches the client.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { connectDb } from "@/lib/db";

export const { GET, POST } = toNextJsHandler(async (request) => {
  await connectDb();
  return getAuth().handler(request);
});
