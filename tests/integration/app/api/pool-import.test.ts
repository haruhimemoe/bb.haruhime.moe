/**
 * @file tests/integration/app/api/pool-import.test.ts
 * @desc GET /api/pools/<id> against msw's pools and osu!: id checks (URL forms, past pools),
 *       private or missing pools, buckets in order with stars under each bucket's mods, the
 *       osu_beatmaps cache, custom buckets, CDN caching only for complete answers, the per-IP
 *       limit and failures.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { HttpResponse, http, type JsonBodyType } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/pools/[id]/route";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, params } from "../../../helpers/requests";

setupTestDb();
const server = setupMsw();

const POOL = {
  id: "b-abcd1234",
  name: "Test Cup [Finals]",
  visibility: "unlisted",
  slots: [
    { mod: "HR", index: 1, beatmapId: 102 },
    { mod: "NM", index: 2, beatmapId: 101 },
    { mod: "NM", index: 1, beatmapId: 100 },
    { mod: "DT", index: 1, beatmapId: 100 },
    { mod: null, index: 1, beatmapId: 103 },
  ],
};

const row = (id: number, stars: number) => ({
  id,
  beatmapset_id: id * 10,
  mode: "osu",
  version: `Diff ${id}`,
  difficulty_rating: stars,
  cs: 4,
  ar: 9,
  accuracy: 8,
  drain: 5,
  bpm: 180,
  total_length: 120,
  checksum: null,
  beatmapset: { artist: "Artist", title: `Song ${id}`, creator: "Mapper", user_id: 5 },
});

let osuCalls: string[] = [];

const pools = (body: JsonBodyType, status = 200) =>
  server.use(
    http.get("https://pools.haruhime.moe/api/pools/:id", () => HttpResponse.json(body, { status })),
  );

beforeEach(() => {
  osuCalls = [];
  pools({ pool: POOL });
  server.use(
    http.post("https://osu.ppy.sh/oauth/token", () =>
      HttpResponse.json({ access_token: "t", token_type: "Bearer", expires_in: 86400 }),
    ),
    http.get("https://osu.ppy.sh/api/v2/beatmaps", ({ request }) => {
      osuCalls.push("beatmaps");
      const ids = new URL(request.url).searchParams.getAll("ids[]").map(Number);
      const known = [row(100, 5), row(101, 5.456), row(102, 6)];
      return HttpResponse.json({ beatmaps: known.filter((one) => ids.includes(one.id)) });
    }),
    http.post(
      "https://osu.ppy.sh/api/v2/beatmaps/:id/attributes",
      async ({ params: p, request }) => {
        const { mods } = (await request.json()) as { mods: string[] };
        osuCalls.push(`rate ${p.id} ${mods.join("")}`);
        return HttpResponse.json({
          attributes: { star_rating: mods.includes("DT") ? 7.25 : 6.5, max_combo: 1 },
        });
      },
    ),
  );
});

const get = (id: string, ip = "203.0.113.20") =>
  GET(apiRequest("GET", `/api/pools/${id}`, null, undefined, { "x-real-ip": ip }), params({ id }));

describe("GET /api/pools/<id>", () => {
  it("answers buckets in order with stars under each bucket's mods", async () => {
    const response = await get("b-abcd1234");
    expect(response.status).toBe(200);
    // One map osu! doesn't know has no rating, so the answer isn't cached.
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { pool } = await response.json();
    expect(pool.name).toBe("Test Cup [Finals]");
    expect(pool.url).toBe("https://pools.haruhime.moe/pools/b-abcd1234");
    expect(pool.buckets.map((b: { code: string | null }) => b.code)).toEqual([
      "NM",
      "HR",
      "DT",
      null,
    ]);
    const [nm, hr, dt, other] = pool.buckets;
    expect(nm.slots.map((s: { label: string }) => s.label)).toEqual(["NM1", "NM2"]);
    expect(nm.slots[1]).toMatchObject({ beatmapId: 101, stars: 5.456 });
    expect(nm.slots[1].map).toEqual({
      artist: "Artist",
      title: "Song 101",
      version: "Diff 101",
      creator: "Mapper",
    });
    expect(hr).toMatchObject({ mods: "HR", slots: [{ stars: 6.5 }] });
    expect(dt).toMatchObject({ mods: "DT", slots: [{ beatmapId: 100, stars: 7.25 }] });
    expect(other.slots[0]).toMatchObject({ beatmapId: 103, map: null, stars: null });
    expect(pool.complete).toBe(false);
    expect(osuCalls.sort()).toEqual(["beatmaps", "rate 100 DT", "rate 102 HR"]);
  });

  it("keeps maps and ratings: a second import asks osu! only for what it lacks", async () => {
    await get("b-abcd1234");
    osuCalls = [];
    const { pool } = await (await get("b-abcd1234")).json();
    expect(osuCalls).toEqual(["beatmaps"]);
    expect(pool.buckets[1].slots[0].stars).toBe(6.5);
  });

  it("rates a custom bucket's forced mods and freemod buckets without mods", async () => {
    pools({
      pool: {
        ...POOL,
        buckets: [
          { code: "FM" },
          { code: "Speed", color: 3, mods: { kind: "forced", set: ["HD", "DT"] } },
        ],
        slots: [
          { mod: "FM", index: 1, beatmapId: 101 },
          { mod: "Speed", index: 1, beatmapId: 102 },
        ],
      },
    });
    const response = await get("b-abcd1234");
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    const { pool } = await response.json();
    expect(pool.buckets.map((b: { code: string; mods: string }) => [b.code, b.mods])).toEqual([
      ["FM", ""],
      ["Speed", "HDDT"],
    ]);
    expect(pool.buckets[1].slots[0]).toMatchObject({ label: "Speed1", stars: 7.25 });
    expect(pool.complete).toBe(true);
  });

  it("takes pools links and refuses past pools and junk", async () => {
    expect(
      (await get(encodeURIComponent("https://pools.haruhime.moe/pools/b-abcd1234/edit"))).status,
    ).toBe(200);
    const past = await get("owc-2024-qf");
    expect(past.status).toBe(400);
    expect((await past.json()).error.code).toBe("past_pool");
    expect((await get("..%2Fadmin")).status).toBe(400);
  });

  it("is 404 for a private, hidden or missing pool", async () => {
    pools({ error: { code: "not_found", message: "no" } }, 404);
    const response = await get("b-zzzz9999");
    expect(response.status).toBe(404);
    expect((await response.json()).error.message).toMatch(/private or gone/);
  });

  it("is 503 when pools or osu! fails, and never cached", async () => {
    pools({ error: {} }, 500);
    const down = await get("b-abcd1234");
    expect(down.status).toBe(503);
    expect(down.headers.get("cache-control")).toContain("no-store");
    pools({ pool: POOL });
    server.use(
      http.get("https://osu.ppy.sh/api/v2/beatmaps", () => new HttpResponse(null, { status: 500 })),
    );
    expect((await get("b-abcd1234")).status).toBe(503);
  });

  it("allows 20 imports a minute per IP", async () => {
    pools({ error: { code: "not_found", message: "no" } }, 404);
    for (let i = 0; i < 20; i++) expect((await get("b-zzzz9999")).status).toBe(404);
    expect((await get("b-zzzz9999")).status).toBe(429);
  });
});
