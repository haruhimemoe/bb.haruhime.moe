/**
 * @file src/app/api/templates/[id]/route.ts
 * @desc PATCH `{ baseVersion, ...change }`: the owner changes a template's content or
 *       visibility; a stale baseVersion is 409 with the template as it is now. DELETE: the owner
 *       deletes it (and its reports). Both signed in, from this site, within the 30 writes a
 *       minute per user; built-in templates are 403, a template the caller can't see 404, one
 *       they see but don't own 403. Never cached.
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
  noContent,
  readBody,
  refusalResponse,
} from "@/lib/template-routes";
import { patchBodySchema } from "@/schemas/template";
import { deleteTemplate, updateTemplate } from "@/services/templates-update";

/**
 * @function PATCH
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 200 with `{ template }`, or a refusal (409 with `template`)
 */
export async function PATCH(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const body = await readBody(request, patchBodySchema);
  if (!body.ok) return body.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await updateTemplate(id, caller.value, body.value);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}

/**
 * @function DELETE
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template id)
 * @returns {Promise<Response>} 204 once it's gone, or a refusal
 */
export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await deleteTemplate(id, caller.value);
  return answer.ok ? noContent() : refusalResponse(answer);
}
