/**
 * @file src/lib/rate-limit.ts
 * @desc bb's rate limiter: next-kit's fixed-window counters in MongoDB (collection rate_limits,
 *       removed by the TTL index a minute after each window ends), on the bb database. Subjects
 *       are IP subjects (next-kit's rateLimitSubject of clientIp, so an IPv6 address counts by
 *       its /64) or, for signed-in writes, next-kit's userSubject ("osu:<osuId>"). Counting
 *       fails open: if the write fails, the request is allowed and the error logged.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import "server-only";
import {
  clientIp,
  createRateLimiter,
  type RateLimiter,
  type RateLimitRule,
  rateLimitSubject,
} from "@haruhimemoe/next-kit/server";
import { RATE_LIMITS_COLLECTION } from "@/constants/db";
import { connectedDb } from "@/lib/db";

/** The process-wide limiter on rate_limits. */
export const limiter: RateLimiter = createRateLimiter({
  db: connectedDb,
  collection: RATE_LIMITS_COLLECTION,
  now: () => Date.now(),
});

/**
 * @function refuseOverLimit
 * @param rule {RateLimitRule} the limit
 * @param subject {string} an IP subject or userSubject
 * @param cost {number} how much this hit counts (default 1)
 * @returns {Promise<Response | null>} a no-store 429 with Retry-After when it's over the limit,
 *          otherwise null
 */
export const refuseOverLimit: RateLimiter["refuseOverLimit"] = (rule, subject, cost) =>
  limiter.refuseOverLimit(rule, subject, cost);

/**
 * @function limitIp
 * @param rule {RateLimitRule} the limit
 * @param headers {Headers} the request's headers (x-real-ip, x-forwarded-for)
 * @returns {Promise<Response | null>} a no-store 429 when this IP is over the limit, otherwise
 *          null
 */
export const limitIp = (rule: RateLimitRule, headers: Headers): Promise<Response | null> =>
  refuseOverLimit(rule, `ip:${rateLimitSubject(clientIp(headers))}`);
