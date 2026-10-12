/**
 * @file src/app/api/templates/[id]/proposals/[pid]/route.ts
 * @desc DELETE: the proposer withdraws an open proposal, addressed by the fork it came from or
 *       the template it was sent to. Signed in, from this site, within the
 *       30 writes a minute per user. 204; 403 for anyone but the proposer, 404 for a proposal
 *       that isn't open. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import { guardWrite, limitUser, noContent, refusalResponse } from "@/lib/template-routes";
import { withdrawProposal } from "@/services/template-proposal-merge";

/**
 * @function DELETE
 * @param request {Request} the incoming request
 * @param context {{ params: Promise<{ id: string; pid: string }> }} the template and proposal ids
 * @returns {Promise<Response>} 204, or a refusal
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
) {
  const { id, pid } = await params;
  const caller = await guardWrite(request);
  if (!caller.ok) return caller.response;
  const limited = await limitUser(RATE_LIMITS.templateWrites, caller.value);
  if (limited) return limited;
  const answer = await withdrawProposal(id, pid, caller.value);
  if (!answer.ok) return refusalResponse(answer);
  return noContent();
}
