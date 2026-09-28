/**
 * @file tests/helpers/requests.ts
 * @desc Requests for the API routes as a browser on this site sends them (JSON, optional session
 *       cookie, extra headers), route contexts, and the cast of users a template test needs
 *       (owner, admin, someone else).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { vi } from "vitest";
import { ADMIN_OSU_ID, createTestAdmin, createTestUser, type TestUser } from "./auth";

/**
 * @function apiRequest
 * @param method {string} HTTP method
 * @param path {string} e.g. /api/templates/t-abcd1234
 * @param cookie {string | null} the session cookie, or null for a visitor
 * @param body {unknown} JSON body (a string is sent as is; undefined sends none)
 * @param headers {Record<string, string>} extra headers
 * @returns {Request} the request
 */
export const apiRequest = (
  method: string,
  path: string,
  cookie: string | null,
  body?: unknown,
  headers: Record<string, string> = {},
): Request =>
  new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });

/** A request another site sent (the browser says so). */
export const CROSS_SITE = { origin: "https://evil.example", "sec-fetch-site": "cross-site" };

/**
 * @function params
 * @param values {T} the route's params
 * @returns {{ params: Promise<T> }} a route context
 */
export const params = <T extends Record<string, string>>(values: T) => ({
  params: Promise.resolve(values),
});

export type Cast = { owner: TestUser; admin: TestUser; other: TestUser };

/**
 * @function createCast
 * @returns {Promise<Cast>} three signed-in users; ADMIN_OSU_IDS lists the admin
 */
export const createCast = async (): Promise<Cast> => {
  vi.stubEnv("ADMIN_OSU_IDS", String(ADMIN_OSU_ID));
  return {
    owner: await createTestUser(10, "owner"),
    admin: await createTestAdmin(ADMIN_OSU_ID),
    other: await createTestUser(40, "other"),
  };
};
