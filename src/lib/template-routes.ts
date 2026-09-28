/**
 * @file src/lib/template-routes.ts
 * @desc What every template route shares. A write needs a session (401 otherwise), then comes
 *       from this site (refuseCrossSite), then has a JSON body of at most
 *       MAX_TEMPLATE_BODY_BYTES that a strict zod schema accepts, then fits the caller's
 *       per-user limit, keyed "osu:<osuId>" so deleting the account and signing in again
 *       doesn't reset it. A service's refusal becomes `{ error: { code, message }, template? }`
 *       (the current template on a 409). Nothing here is ever cached: answers depend on who
 *       asks.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import {
  jsonError,
  noStore,
  parseJsonBody,
  type RateLimitRule,
  userSubject,
} from "@haruhimemoe/next-kit/server";
import type { z } from "zod";
import { MAX_TEMPLATE_BODY_BYTES } from "@/constants/api";
import { refuseCrossSite } from "@/lib/api";
import { getUserFromHeaders } from "@/lib/auth";
import { refuseOverLimit } from "@/lib/rate-limit";
import type { SessionUser } from "@/schemas/session-user";
import type { Refusal } from "@/utils/answer";

/** A route guard's result: the value, or the response to send. */
export type Guarded<T> = { ok: true; value: T } | { ok: false; response: Response };

/** The route context of /api/templates/[id]/*. */
export type IdContext = { params: Promise<{ id: string }> };

/**
 * @function guardWrite
 * @param request {Request} a write
 * @returns {Promise<Guarded<SessionUser>>} the signed-in caller, or a 401 or 403 answer
 */
export const guardWrite = async (request: Request): Promise<Guarded<SessionUser>> => {
  const user = await getUserFromHeaders(request.headers);
  if (!user) return { ok: false, response: noStore(jsonError(401, "Sign in first.")) };
  const crossSite = refuseCrossSite(request);
  if (crossSite) return { ok: false, response: noStore(crossSite) };
  return { ok: true, value: user };
};

/**
 * @function readBody
 * @param request {Request} the write
 * @param schema {z.ZodType} what the body must be
 * @returns {Promise<Guarded<z.output<T>>>} the body, or a 415, 413 or 400 answer
 */
export const readBody = async <T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<Guarded<z.output<T>>> => {
  const body = await parseJsonBody(request, schema, {
    maxBytes: MAX_TEMPLATE_BODY_BYTES,
    tooLarge: "That template is too large.",
  });
  return body.ok ? { ok: true, value: body.data } : { ok: false, response: noStore(body.response) };
};

/**
 * @function limitUser
 * @param rule {RateLimitRule} the limit
 * @param user {Pick<SessionUser, "osuId">} the caller
 * @returns {Promise<Response | null>} a 429 (no-store) when it's over, otherwise null
 */
export const limitUser = (
  rule: RateLimitRule,
  user: Pick<SessionUser, "osuId">,
): Promise<Response | null> => refuseOverLimit(rule, userSubject(user));

/**
 * @function refusalResponse
 * @param refusal {Refusal} a service's refusal
 * @returns {Response} its status with `{ error: { code, message }, template? }`
 */
export const refusalResponse = ({ status, code, message, template }: Refusal): Response =>
  noStore(
    Response.json({ error: { code, message }, ...(template ? { template } : {}) }, { status }),
  );

/**
 * @function jsonResponse
 * @param body {unknown} what to send
 * @param status {number} HTTP status (default 200)
 * @returns {Response} JSON, never cached
 */
export const jsonResponse = (body: unknown, status = 200): Response =>
  noStore(Response.json(body, { status }));

/**
 * @function noContent
 * @returns {Response} 204, never cached
 */
export const noContent = (): Response => noStore(new Response(null, { status: 204 }));
