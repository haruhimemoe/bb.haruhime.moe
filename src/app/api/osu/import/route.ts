/**
 * @file src/app/api/osu/import/route.ts
 * @desc GET ?ref=: the editor's Import tool, the BBCode of an osu! forum post or userpage
 *       (src/services/forum-import.ts). No sign-in; 20 imports a minute per IP, and osu! calls
 *       spend the osu! budget. Something that isn't a ref, or a post link that doesn't lead to its
 *       topic, is 400; nothing there is 404; the budget is 429; osu! failing is 503. A found post
 *       or page stays 5 minutes on the CDN.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { clientIp, jsonError, noStore, rateLimitSubject } from "@haruhimemoe/next-kit/server";
import { RATE_LIMITS } from "@/constants/api";
import { OsuApiError, osuBudget } from "@/lib/osu";
import { limitIp } from "@/lib/rate-limit";
import { ForumUnavailableError, importFromRef, UnresolvedPostError } from "@/services/forum-import";
import { parseImportRef } from "@/utils/import-ref";

const INVALID = "Paste an osu! forum link, a profile link, a username, or @ and an id.";
const NOT_FOUND = "osu! has no post or userpage there, or it's empty.";
const UNRESOLVED =
  "bb couldn't find that post's topic. Paste the topic link (with ?start=) instead.";
const BUDGET = "Too many imports right now. Try again in a minute.";
const DOWN = "osu! isn't answering right now. Try again in a minute.";

/**
 * @function GET
 * @param request {Request} the incoming request, with `ref`
 * @returns {Promise<Response>} 200 with `{ source, bbcode }`, or a 400, 404, 429 or 503
 */
export async function GET(request: Request) {
  const ref = parseImportRef(new URL(request.url).searchParams.get("ref") ?? "");
  if (ref.kind === "invalid") return noStore(jsonError(400, INVALID));
  const limited = await limitIp(RATE_LIMITS.forumImports, request.headers);
  if (limited) return limited;
  const subject = `ip:${rateLimitSubject(clientIp(request.headers))}`;
  try {
    const found = await importFromRef(ref, osuBudget.gate(subject));
    if (!found) return noStore(jsonError(404, NOT_FOUND));
    const response = Response.json(found);
    response.headers.set("cache-control", "public, max-age=0, s-maxage=300");
    return response;
  } catch (error) {
    if (error instanceof UnresolvedPostError) return noStore(jsonError(400, UNRESOLVED));
    if (error instanceof OsuApiError && error.code === "budget") {
      return noStore(jsonError(429, BUDGET));
    }
    if (error instanceof OsuApiError || error instanceof ForumUnavailableError) {
      console.error(
        "forum import: osu! failed",
        error instanceof OsuApiError ? error.code : "head",
      );
      return noStore(jsonError(503, DOWN));
    }
    throw error;
  }
}
