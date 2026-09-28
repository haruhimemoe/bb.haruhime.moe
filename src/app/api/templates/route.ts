/**
 * @file src/app/api/templates/route.ts
 * @desc POST: the signed-in user makes a template `{ name, description, kind, body, fields,
 *       visibility? }` (private unless given). Signed in, from this site, a JSON body the
 *       content schema accepts (every text through the content filter), within the 30 writes a
 *       minute per user, and under the 100-template cap. 201 with the template. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import {
  guardWrite,
  jsonResponse,
  limitUser,
  readBody,
  refusalResponse,
} from "@/lib/template-routes";
import { createBodySchema } from "@/schemas/template";
import { insertTemplate } from "@/services/templates-create";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @returns {Promise<Response>} 201 with `{ template }`, or a refusal
 */
export async function POST(request: Request) {
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const body = await readBody(request, createBodySchema);
  if (!body.ok) return body.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const { visibility, ...content } = body.value;
  const answer = await insertTemplate(caller.value, content, visibility, null);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value }, 201);
}
