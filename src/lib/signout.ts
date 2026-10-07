/**
 * @file src/lib/signout.ts
 * @desc Sign-out for a satellite of the haruhime.moe hub, run on bb's server. The hub's
 *       /api/auth/sign-out (better-auth) deletes the session row only when it gets the session
 *       cookie and, since a cookie is sent, an Origin in its trustedOrigins (bb.haruhime.moe is).
 *       So bb forwards that one cookie (never the rest of the visitor's cookies) with Origin set
 *       to bb's own, redirect "manual" so a redirect can't carry it elsewhere. The hub's own
 *       Set-Cookie answers never reach the browser (this is a server fetch), so bb clears the same
 *       cookies itself: the session token, its cookie cache and dont_remember, under both the
 *       __Secure- and bare names, and the shared signed-in marker, all on HUB_COOKIE_DOMAIN when
 *       it's set (host-only locally).
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import "server-only";
import { SIGNED_IN_COOKIE, SITE } from "@/constants/site";

/** better-auth's cookie prefix (the hub keeps the default). */
const AUTH_PREFIX = "better-auth";

/** The session token cookie, before any __Secure- prefix. */
export const SESSION_COOKIE = `${AUTH_PREFIX}.session_token`;

/** Every better-auth cookie a session leaves in the browser. */
const AUTH_COOKIES = [
  SESSION_COOKIE,
  `${AUTH_PREFIX}.session_data`,
  `${AUTH_PREFIX}.dont_remember`,
];

/**
 * @function sessionCookieHeader
 * @param cookieHeader {string | null} the request's Cookie header
 * @returns {string | null} a Cookie header with only the session token cookie(s), or null
 */
export const sessionCookieHeader = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null;
  const names = new Set([`__Secure-${SESSION_COOKIE}`, SESSION_COOKIE]);
  const kept = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => names.has(part.slice(0, part.indexOf("="))));
  return kept.length > 0 ? kept.join("; ") : null;
};

/**
 * @function clearAuthCookies
 * @param domain {string | undefined} HUB_COOKIE_DOMAIN, or undefined for host-only
 * @returns {string[]} Set-Cookie values that expire every hub cookie and the marker
 */
export const clearAuthCookies = (domain: string | undefined): string[] => {
  const scope = `Path=/; Max-Age=0; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
  const auth = AUTH_COOKIES.flatMap((name) => [
    `__Secure-${name}=; ${scope}; Secure; HttpOnly`,
    `${name}=; ${scope}; HttpOnly`,
  ]);
  return [...auth, `${SIGNED_IN_COOKIE}=; ${scope}`];
};

/**
 * @function signOutOnHub
 * @param cookieHeader {string | null} the request's Cookie header
 * @param hubUrl {string} the hub's origin (HUB_URL)
 * @param fetchImpl {typeof fetch} fetch (tests pass their own)
 * @returns {Promise<boolean>} true when the hub answered 2xx; false when there was no session
 *          cookie, the hub refused, or it couldn't be reached (the cookies are cleared anyway)
 */
export const signOutOnHub = async (
  cookieHeader: string | null,
  hubUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> => {
  const cookie = sessionCookieHeader(cookieHeader);
  if (!cookie) return false;
  try {
    const response = await fetchImpl(new URL("/api/auth/sign-out", hubUrl), {
      method: "POST",
      headers: { cookie, origin: SITE.url, "content-type": "application/json" },
      body: "{}",
      redirect: "manual",
      cache: "no-store",
    });
    if (!response.ok) console.error(`[signout] hub answered ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("[signout] hub unreachable", error);
    return false;
  }
};
