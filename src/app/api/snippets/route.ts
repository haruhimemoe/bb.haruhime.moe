/**
 * @file src/app/api/snippets/route.ts
 * @desc GET: the editor's snippets: the caller's own and the public ones others share, and
 *       whether the caller is signed in. Anyone, 60 a minute per IP; the lists depend on who
 *       asks, so never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { RATE_LIMITS } from "@/constants/api";
import { getUserFromHeaders } from "@/lib/auth";
import { limitIp } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/template-routes";
import { listSnippets } from "@/services/snippets";

/**
 * @function GET
 * @param request {Request} the incoming request
 * @returns {Promise<Response>} 200 with `{ mine, shared, signedIn }`, or a 429
 */
export async function GET(request: Request) {
  const limited = await limitIp(RATE_LIMITS.snippetReads, request.headers);
  if (limited) return limited;
  const user = await getUserFromHeaders(request.headers);
  return jsonResponse(await listSnippets(user));
}
