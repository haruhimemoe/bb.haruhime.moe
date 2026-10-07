/**
 * @file src/constants/api.ts
 * @desc Rate limits: per user (by osu! id) on template writes, reports and account deletion,
 *       and per IP on "Use" (the uses counter), player lookups and pool imports. Counters live
 *       in rate_limits (src/lib/rate-limit.ts). Also the largest JSON body a template write may
 *       send, and the public API's key prefix (hbb_), its docs and OpenAPI paths, and next-kit's
 *       standard API limits.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sat Oct 3, 2026
 */

import { API_LIMITS } from "@haruhimemoe/next-kit/api-keys";
import type { RateLimitRule } from "@haruhimemoe/next-kit/server";

/** bb's key prefix (haruhime-app-standards registry). */
export const API_KEY_PREFIX = "hbb_";
/** What a key may do: read (GET) and write (POST, PUT, DELETE). Keys made before scopes read as ["*"]. */
export const API_KEY_SCOPES = ["read", "write"] as const;
/** The API docs page. */
export const API_DOCS_PATH = "/docs/api";
/** The OpenAPI document, the one /api path robots.txt allows. */
export const OPENAPI_PATH = "/api/v1/openapi.json";

/** Every rate limit bb counts, per IP or per osu! account. */
export const RATE_LIMITS = {
  /** Creating, editing, forking and deleting templates, per user. */
  templateWrites: { scope: "template-writes", limit: 30, windowSeconds: 60 },
  /** Reporting templates, per user. */
  templateReports: { scope: "template-reports", limit: 10, windowSeconds: 3600 },
  /** "Use" bumping a template's uses counter, per IP. */
  templateUses: { scope: "template-uses", limit: 30, windowSeconds: 3600 },
  /** POST /api/osu/users, per IP (each may look up 64 names; osu! calls also spend the budget). */
  userLookups: { scope: "user-lookups", limit: 20, windowSeconds: 60 },
  /** GET /api/pools/<id>, per IP. */
  poolImports: { scope: "pool-imports", limit: 20, windowSeconds: 60 },
  /** DELETE /api/account, per osu! account (it outlives the account it counts). */
  accountDelete: { scope: "account-delete", limit: 3, windowSeconds: 3600 },
  /** Every /api/v1 request, per user. */
  api: API_LIMITS.api,
  /** /api/v1 writes, per user. */
  apiWrite: API_LIMITS.apiWrite,
  /** Missing, bad or revoked API keys, per IP. */
  authFail: API_LIMITS.authFail,
  /** Creating or regenerating an API key, per user. */
  keyCreate: API_LIMITS.keyCreate,
} as const satisfies Record<string, RateLimitRule>;

/**
 * A template body is at most 60,000 characters; JSON escaping and 3-byte characters can grow
 * that, so a write may send up to 512 KB.
 */
export const MAX_TEMPLATE_BODY_BYTES = 512 * 1024;
