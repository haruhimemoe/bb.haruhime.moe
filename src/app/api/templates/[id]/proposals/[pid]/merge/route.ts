/**
 * @file src/app/api/templates/[id]/proposals/[pid]/merge/route.ts
 * @desc POST: the template's owner merges an open proposal: its changes are laid on the template
 *       from the revision they started from, keeping the owner's own changes since. No body.
 *       Signed in, from this site, within the 30 writes a minute per user. 200 with
 *       `{ template }`; a 409 `proposal_conflict` carries the merged draft (and `merged`, the
 *       proposal to name on the resolving save); 403 for anyone but the owner, 404 for a proposal
 *       that isn't open. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import { guardWrite, jsonResponse, limitUser, refusalResponse } from "@/lib/template-routes";
import { mergeProposal } from "@/services/template-proposals";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @param context {{ params: Promise<{ id: string; pid: string }> }} the template and proposal ids
 * @returns {Promise<Response>} 200 with `{ template }`, or a refusal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
) {
  const { id, pid } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await mergeProposal(id, pid, caller.value);
  if (!answer.ok) return refusalResponse(answer);
  return jsonResponse({ template: answer.value });
}
