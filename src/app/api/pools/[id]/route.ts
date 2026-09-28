/**
 * @file src/app/api/pools/[id]/route.ts
 * @desc GET: a pools.haruhime.moe built pool for the editor's pool import, with each map and
 *       its star rating under its bucket's mods (src/services/pool-import.ts). No sign-in; 20
 *       imports a minute per IP. A malformed id is 400 (a past pool's says so), a pool that's
 *       private, hidden or missing is 404, pools or osu! failing is 503. A complete answer stays
 *       5 minutes on the CDN; one missing a star rating is never cached.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { clientIp, jsonError, noStore, rateLimitSubject } from "@haruhimemoe/next-kit/server";
import { OsuApiError } from "@haruhimemoe/osu";
import { RATE_LIMITS } from "@/constants/api";
import { osuBudget } from "@/lib/osu";
import { limitIp } from "@/lib/rate-limit";
import { importPool, PoolsUnavailableError } from "@/services/pool-import";
import { parsePoolRef } from "@/utils/pool-ref";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "pools has no public or unlisted pool with that id. It may be private or gone.";

/**
 * @function GET
 * @param request {Request} the incoming request
 * @param context {Context} the route's params (the pool id)
 * @returns {Promise<Response>} 200 with `{ pool }`, or a 400, 404, 429 or 503
 */
export async function GET(request: Request, { params }: Context) {
  const ref = parsePoolRef(decodeURIComponent((await params).id));
  if (!ref.ok)
    return noStore(
      jsonError(400, ref.message, ref.reason === "past" ? "past_pool" : "bad_request"),
    );
  const limited = await limitIp(RATE_LIMITS.poolImports, request.headers);
  if (limited) return limited;
  const subject = `ip:${rateLimitSubject(clientIp(request.headers))}`;
  try {
    const pool = await importPool(ref.id, osuBudget.gate(subject));
    if (!pool) return noStore(jsonError(404, NOT_FOUND));
    const response = Response.json({ pool });
    response.headers.set(
      "cache-control",
      pool.complete ? "public, max-age=0, s-maxage=300" : "no-store",
    );
    return response;
  } catch (error) {
    if (error instanceof PoolsUnavailableError) {
      console.error("pool import: pools failed", error.message);
      return noStore(
        jsonError(503, "pools.haruhime.moe isn't answering right now. Try again soon."),
      );
    }
    if (error instanceof OsuApiError) {
      console.error("pool import: osu! failed", error.code);
      return noStore(jsonError(503, "osu! isn't answering right now. Try again in a minute."));
    }
    throw error;
  }
}
