/**
 * @file src/app/api/admin/templates/[id]/reports/route.ts
 * @desc DELETE: an admin (ADMIN_OSU_IDS, read per request) clears a template's reports: its
 *       counter goes to 0 and a hidden template shows again. Everyone but an admin gets 404, then
 *       other sites are refused. 200 with the template. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { jsonError, noStore } from "@haruhimemoe/next-kit/server";
import { refuseCrossSite } from "@/lib/api";
import { getAdminFromHeaders } from "@/lib/auth";
import { type IdContext, jsonResponse, refusalResponse } from "@/lib/template-routes";
import { clearReports } from "@/services/template-reports";

/**
 * @function DELETE
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 200 with `{ template }`, or a 404 or 403
 */
export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  if (!(await getAdminFromHeaders(request.headers))) {
    return noStore(jsonError(404, "Not found."));
  }
  const crossSite = refuseCrossSite(request);
  if (crossSite) return noStore(crossSite);
  const answer = await clearReports(id);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}
