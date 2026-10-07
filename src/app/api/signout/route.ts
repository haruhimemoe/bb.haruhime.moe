/**
 * @file src/app/api/signout/route.ts
 * @desc POST /api/signout: signs out of every haruhime tool without leaving bb. Cross-site
 *       requests are refused. The server ends the session on the hub (only the session cookie
 *       is forwarded, src/lib/signout.ts), then answers 204 clearing the hub's cookies and the
 *       signed-in marker on HUB_COOKIE_DOMAIN, even when the hub couldn't be reached. Never
 *       cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import { noStore } from "@haruhimemoe/next-kit/server";
import { getHubCookieDomain, getHubUrl } from "@/env";
import { refuseCrossSite } from "@/lib/api";
import { clearAuthCookies, signOutOnHub } from "@/lib/signout";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @returns {Promise<Response>} 204 with the cookies cleared, or 403 cross-site
 */
export async function POST(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return noStore(crossSite);
  await signOutOnHub(request.headers.get("cookie"), getHubUrl());
  const response = noStore(new Response(null, { status: 204 }));
  for (const cookie of clearAuthCookies(getHubCookieDomain())) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
