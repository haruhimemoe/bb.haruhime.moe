/**
 * @file src/app/api/templates/[id]/history/[rev]/revert/route.ts
 * @desc POST: the owner restores a template to an earlier revision. No body. Signed in, from
 *       this site, within the 30 writes a minute per user. 200 with `{ template }`; a 400 when
 *       today's content rules refuse the old text; a 404 for an unknown revision. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import { guardWrite, jsonResponse, limitUser, refusalResponse } from "@/lib/template-routes";
import { revertTemplate } from "@/services/template-revert";

/** The route context: the template id and the revision to restore. */
type RevertContext = { params: Promise<{ id: string; rev: string }> };

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {RevertContext} the route's params (the template id and revision)
 * @returns {Promise<Response>} 200 with `{ template }`, or a refusal
 */
export async function POST(request: Request, { params }: RevertContext) {
  const { id, rev } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await revertTemplate(id, caller.value, rev);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}
