/**
 * @file src/app/api/account/route.ts
 * @desc DELETE: the signed-in user deletes their own account and every template they own. A
 *       visitor gets 401; then requests from other sites (a sibling *.haruhime.moe host
 *       included) are refused, and the body must be JSON: `{ username }`, the caller's osu!
 *       username as they typed it to confirm (trimmed, exact case), then at most 3 deletions an
 *       hour per osu! account. 204, clearing the signed-in marker. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { jsonError, noStore, parseJsonBody } from "@haruhimemoe/next-kit/server";
import { RATE_LIMITS } from "@/constants/api";
import { SIGNED_IN_COOKIE } from "@/constants/site";
import { refuseCrossSite } from "@/lib/api";
import { getUserFromHeaders } from "@/lib/auth";
import { limitUser, noContent } from "@/lib/template-routes";
import { accountDeleteBodySchema } from "@/schemas/template-view";
import { deleteAccount } from "@/services/account";

// The 400 message when the typed name does not match.
const CONFIRM_MISMATCH = "Type your osu! username exactly as it's shown to confirm.";

/**
 * @function DELETE
 * @param request {Request} the incoming request
 * @returns {Promise<Response>} 204 once the account is gone, or a refusal
 */
export async function DELETE(request: Request) {
  const user = await getUserFromHeaders(request.headers);
  if (!user) return noStore(jsonError(401, "Sign in first."));
  const crossSite = refuseCrossSite(request);
  if (crossSite) return noStore(crossSite);
  const body = await parseJsonBody(request, accountDeleteBodySchema);
  if (!body.ok) return noStore(body.response);
  if (body.data.username !== user.username) {
    return noStore(jsonError(400, CONFIRM_MISMATCH, "confirm_mismatch"));
  }
  // By osu! id: deleting, signing in again and deleting can't go round it.
  const limited = await limitUser(RATE_LIMITS.accountDelete, user);
  if (limited) return limited;
  await deleteAccount(user);
  const response = noContent();
  response.headers.append("Set-Cookie", `${SIGNED_IN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return response;
}
