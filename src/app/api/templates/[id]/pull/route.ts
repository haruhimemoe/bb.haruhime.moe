/**
 * @file src/app/api/templates/[id]/pull/route.ts
 * @desc POST: the fork's owner merges in whatever the upstream template has saved since this fork
 *       last took in a revision. No body. Signed in, from this site, within the 30 writes a
 *       minute per user. 200 with `{ template }`; a 409 `pull_conflict` carries the merged draft
 *       to resolve in the form; a 404 `upstream_unavailable` when the upstream is gone. Never
 *       cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import {
  guardWrite,
  type IdContext,
  jsonResponse,
  limitUser,
  refusalResponse,
} from "@/lib/template-routes";
import { pullUpstream } from "@/services/template-upstream";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the fork's id)
 * @returns {Promise<Response>} 200 with `{ template }`, or a refusal
 */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await pullUpstream(id, caller.value);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}
