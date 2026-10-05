/**
 * @file src/app/api/templates/[id]/history/route.ts
 * @desc PUT `{ historyPublic }`: the owner turns a template's history public or private. Signed
 *       in, from this site, within the 30 writes a minute per user; built-in templates and
 *       non-owners are refused. 200 with `{ template }`. Never cached.
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
  readBody,
  refusalResponse,
} from "@/lib/template-routes";
import { historyBodySchema } from "@/schemas/template-view";
import { setTemplateHistoryPublic } from "@/services/template-history-read";

/**
 * @function PUT
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 200 with `{ template }`, or a refusal
 */
export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const body = await readBody(request, historyBodySchema);
  if (!body.ok) return body.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await setTemplateHistoryPublic(id, caller.value, body.value.historyPublic);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}
