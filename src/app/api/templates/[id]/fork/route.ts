/**
 * @file src/app/api/templates/[id]/fork/route.ts
 * @desc POST: the signed-in user copies a template they can see (built-in ones included) into a
 *       new private template of their own, "<name> (copy)" with forkOf pointing back. Signed in,
 *       from this site, within the 30 writes a minute per user and the 100-template cap. No
 *       body. 201 with the copy. Never cached.
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
  refusalResponse,
} from "@/lib/template-routes";
import { forkTemplate } from "@/services/templates-create";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the template to copy)
 * @returns {Promise<Response>} 201 with `{ template }`, or a refusal
 */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await forkTemplate(id, caller.value);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value }, 201);
}
