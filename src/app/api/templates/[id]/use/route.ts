/**
 * @file src/app/api/templates/[id]/use/route.ts
 * @desc POST: "Use" on a template's page counts one use (the gallery's Most used). No sign-in
 *       and no body; it must come from this site, and each IP counts at most 30 uses an hour
 *       (over that the use still happens in the browser, just uncounted). A private or hidden
 *       template, or none, is 404. 204. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { jsonError, noStore } from "@haruhimemoe/next-kit/server";
import { RATE_LIMITS } from "@/constants/api";
import { refuseCrossSite } from "@/lib/api";
import { limitIp } from "@/lib/rate-limit";
import { type IdContext, noContent } from "@/lib/template-routes";
import { bumpUses } from "@/services/template-uses";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 204 once counted, or a 403, 404 or 429
 */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  const crossSite = refuseCrossSite(request);
  if (crossSite) return noStore(crossSite);
  const limited = await limitIp(RATE_LIMITS.templateUses, request.headers);
  if (limited) return limited;
  if (!(await bumpUses(id))) return noStore(jsonError(404, "That template doesn't exist."));
  return noContent();
}
