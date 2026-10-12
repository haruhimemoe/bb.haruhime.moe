/**
 * @file src/app/api/templates/[id]/propose/route.ts
 * @desc POST: a fork's owner offers the fork's BBCode and fields to the template it copied, with
 *       a note (`{ message }`, up to 280 characters). Signed in, from this site, 10 proposals an
 *       hour per user. 200 with `{ proposal }` (proposing again replaces the fork's open one);
 *       404 `upstream_unavailable` for a template that isn't a fork or whose original is gone,
 *       409 `no_changes` when there's nothing new. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
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
import { proposalBodySchema } from "@/schemas/proposal";
import { createProposal } from "@/services/template-proposals";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {IdContext} the route's params (the fork's id)
 * @returns {Promise<Response>} 200 with `{ proposal }`, or a refusal
 */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const body = await readBody(request, proposalBodySchema);
  if (!body.ok) return body.response;
  const limited = await limitUser(RATE_LIMITS.templateProposals, caller.value);
  if (limited) return limited;
  const answer = await createProposal(id, caller.value, body.value);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ proposal: answer.value });
}
