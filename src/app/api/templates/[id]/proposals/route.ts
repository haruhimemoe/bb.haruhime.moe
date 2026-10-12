/**
 * @file src/app/api/templates/[id]/proposals/route.ts
 * @desc GET: the template's open proposals, newest first, each with what it changes, for the
 *       template's owner only. Signed in. 200 with `{ proposals }`; 401 signed out, 404 when the
 *       caller can't see the template, 403 for anyone but its owner. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { jsonError, noStore } from "@haruhimemoe/next-kit/server";
import { getUserFromHeaders } from "@/lib/auth";
import { type IdContext, jsonResponse, refusalResponse } from "@/lib/template-routes";
import { listProposals } from "@/services/template-proposals";

/**
 * @function GET
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 200 with `{ proposals }`, or a refusal
 */
export async function GET(request: Request, { params }: IdContext) {
  const { id } = await params;
  const user = await getUserFromHeaders(request.headers);
  if (!user) return noStore(jsonError(401, "Sign in first."));
  const answer = await listProposals(id, user);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ proposals: answer.value });
}
