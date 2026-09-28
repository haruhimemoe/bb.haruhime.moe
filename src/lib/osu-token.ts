/**
 * @file src/lib/osu-token.ts
 * @desc A client-credentials token (scope public) for the osu! calls @haruhimemoe/osu's client
 *       doesn't make (user lookups): asked for on first use, shared by concurrent callers, kept
 *       until a minute before it expires, and dropped by osuGet after a 401 so the next call
 *       asks again. osuGet sends the token and bb's User-Agent, and gives up after 10 s.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import "server-only";
import { z } from "zod";
import { OSU_BASE_URL } from "@/constants/osu";
import { SERVER_USER_AGENT } from "@/constants/site";
import { osuCredentials } from "@/lib/osu";

const TIMEOUT_MS = 10_000;
const tokenSchema = z.object({ access_token: z.string().min(1), expires_in: z.number() });

let cached: { token: string; until: number } | null = null;
let pending: Promise<string> | null = null;

/** Why an osu! call failed: no answer, an error status, or a body we couldn't read. */
export class OsuCallError extends Error {}

const requestToken = async (): Promise<string> => {
  const { clientId, clientSecret } = osuCredentials();
  const response = await fetch(`${OSU_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": SERVER_USER_AGENT,
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "public",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((cause: unknown) => {
    throw new OsuCallError("osu!'s token endpoint didn't answer.", { cause });
  });
  if (!response.ok) throw new OsuCallError(`osu! refused the token request (${response.status}).`);
  const parsed = tokenSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new OsuCallError("osu!'s token answer wasn't readable.");
  const lifeMs = parsed.data.expires_in * 1000;
  cached = {
    token: parsed.data.access_token,
    until: Date.now() + Math.max(lifeMs - 60_000, lifeMs / 2),
  };
  return parsed.data.access_token;
};

/**
 * @function osuToken
 * @returns {Promise<string>} a live token, asked for when there's none (one request at a time)
 * @throws {OsuCallError} when osu! doesn't answer or refuses
 */
export const osuToken = async (): Promise<string> => {
  if (cached && cached.until > Date.now()) return cached.token;
  pending ??= requestToken().finally(() => {
    pending = null;
  });
  return pending;
};

/**
 * @function osuGet
 * @param path {string} an API path with its query, like "/api/v2/users?ids[]=2"
 * @returns {Promise<Response>} osu!'s answer (after one retry with a fresh token on a 401)
 * @throws {OsuCallError} when osu! can't be reached, times out, or refuses the token
 */
export const osuGet = async (path: string): Promise<Response> => {
  for (let attempt = 0; ; attempt++) {
    const token = await osuToken();
    const response = await fetch(`${OSU_BASE_URL}${path}`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        "user-agent": SERVER_USER_AGENT,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((cause: unknown) => {
      throw new OsuCallError("osu! didn't answer.", { cause });
    });
    if (response.status !== 401 || attempt > 0) return response;
    if (cached?.token === token) cached = null;
  }
};

/**
 * @function forgetOsuToken
 * @returns {void} drops the kept token (tests)
 */
export const forgetOsuToken = (): void => {
  cached = null;
};
