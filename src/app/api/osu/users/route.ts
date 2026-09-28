/**
 * @file src/app/api/osu/users/route.ts
 * @desc POST: looks up osu! users for the player list and the collab maker. No sign-in; it must
 *       come from this site, and each IP makes 20 lookups a minute. The body is `{ names }`, 1 to
 *       64 ids, names or profile links. Answers `{ users, notFound, unchecked }`: found users
 *       in the order asked, what osu! has no user for, and what the osu! budget left unasked.
 *       osu! failing is 503. Never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import {
  clientIp,
  jsonError,
  noStore,
  parseJsonBody,
  rateLimitSubject,
} from "@haruhimemoe/next-kit/server";
import { RATE_LIMITS } from "@/constants/api";
import { refuseCrossSite } from "@/lib/api";
import { osuBudget } from "@/lib/osu";
import { OsuCallError } from "@/lib/osu-token";
import { limitIp } from "@/lib/rate-limit";
import { playerLookupBodySchema } from "@/schemas/osu-users";
import { lookupUsers } from "@/services/osu-users";
import { parsePlayer, playerAnswer } from "@/utils/player-names";

/**
 * @function POST
 * @param request {Request} the incoming request
 * @returns {Promise<Response>} 200 with the answer, or a 400, 403, 413, 415, 429 or 503
 */
export async function POST(request: Request) {
  const crossSite = refuseCrossSite(request);
  if (crossSite) return noStore(crossSite);
  const limited = await limitIp(RATE_LIMITS.userLookups, request.headers);
  if (limited) return limited;
  const body = await parseJsonBody(request, playerLookupBodySchema);
  if (!body.ok) return noStore(body.response);
  const { names } = body.data;
  const queries = names.map(parsePlayer).filter((query) => query !== null);
  const subject = `ip:${rateLimitSubject(clientIp(request.headers))}`;
  try {
    const found = await lookupUsers(queries, osuBudget.gate(subject));
    return noStore(Response.json(playerAnswer(names, found)));
  } catch (error) {
    if (!(error instanceof OsuCallError)) throw error;
    console.error("osu! user lookup failed", error.message);
    return noStore(jsonError(503, "osu! isn't answering right now. Try again in a minute."));
  }
}
