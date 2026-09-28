/**
 * @file src/lib/auth-client.ts
 * @desc better-auth browser client with typed additional user fields (sign-in, sign-out and the account store).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "@/lib/auth";

/** better-auth's browser client, with bb's user fields typed and no refetch on focus. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>()],
  sessionOptions: { refetchOnWindowFocus: false },
});
