/**
 * @file src/app/api/templates/[id]/report/route.ts
 * @desc POST `{ reason }`: the signed-in user reports a template they can see and don't own,
 *       once. Signed in, from this site, within 10 reports an hour per user. A public template
 *       with 3 reports is hidden until an admin clears it. 200 with `{ hidden }`. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import {
  guardWrite,
  type IdContext,
  jsonResponse,
  limitUser,
  readBody,
  refusalResponse,
} from "@/lib/template-routes";
import { reportBodySchema } from "@/schemas/template-view";
import { reportTemplate } from "@/services/template-reports";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 200 with `{ hidden }`, or a refusal (409 when already reported)
 */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const body = await readBody(request, reportBodySchema);
  if (!body.ok) return body.response;
  const limited = await limitUser(RATE_LIMITS.templateReports, caller.value);
  if (limited) return limited;
  const answer = await reportTemplate(id, caller.value, body.value.reason);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse(answer.value);
}
