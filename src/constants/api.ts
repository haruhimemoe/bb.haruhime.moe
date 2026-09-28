/**
 * @file src/constants/api.ts
 * @desc Rate limits: per user (by osu! id) on template writes, reports and account deletion,
 *       and per IP on "Use" (the uses counter). Counters live in rate_limits
 *       (src/lib/rate-limit.ts). Also the largest JSON body a template write may send.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { RateLimitRule } from "@haruhimemoe/next-kit/server";

/** Every rate limit bb counts, per IP or per osu! account. */
export const RATE_LIMITS = {
  /** Creating, editing, forking and deleting templates, per user. */
  templateWrites: { scope: "template-writes", limit: 30, windowSeconds: 60 },
  /** Reporting templates, per user. */
  templateReports: { scope: "template-reports", limit: 10, windowSeconds: 3600 },
  /** "Use" bumping a template's uses counter, per IP. */
  templateUses: { scope: "template-uses", limit: 30, windowSeconds: 3600 },
  /** DELETE /api/account, per osu! account (it outlives the account it counts). */
  accountDelete: { scope: "account-delete", limit: 3, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * A template body is at most 60,000 characters; JSON escaping and 3-byte characters can grow
 * that, so a write may send up to 512 KB.
 */
export const MAX_TEMPLATE_BODY_BYTES = 512 * 1024;
