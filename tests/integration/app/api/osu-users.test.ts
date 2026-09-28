/**
 * @file tests/integration/app/api/osu-users.test.ts
 * @desc POST /api/osu/users against msw's osu!: validation, same-site only, found users in the
 *       order asked with unknown names reported, the 24 h cache (a second lookup asks osu!
 *       nothing), the per-IP limit, the osu! budget and osu! failing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/osu/users/route";
import { forgetOsuToken } from "@/lib/osu-token";
import { osuUsersCollection } from "@/models/OsuCache";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE } from "../../../helpers/requests";

setupTestDb();
const server = setupMsw();

const PEPPY = { id: 2, username: "peppy", country_code: "AU" };
const COOKIEZI = { id: 124493, username: "Cookiezi", country: { code: "KR" } };
let calls: string[] = [];

beforeEach(() => {
  calls = [];
  forgetOsuToken();
  server.use(
    http.post("https://osu.ppy.sh/oauth/token", () =>
      HttpResponse.json({ access_token: "t", token_type: "Bearer", expires_in: 86400 }),
    ),
    http.get("https://osu.ppy.sh/api/v2/users", ({ request }) => {
      calls.push(request.url);
      const ids = new URL(request.url).searchParams.getAll("ids[]").map(Number);
      return HttpResponse.json({ users: [PEPPY, COOKIEZI].filter((u) => ids.includes(u.id)) });
    }),
    http.get("https://osu.ppy.sh/api/v2/users/:user", ({ params, request }) => {
      calls.push(request.url);
      const name = String(params.user).replace(/^@/, "").toLowerCase();
      const user = [PEPPY, COOKIEZI].find((u) => u.username.toLowerCase() === name);
      return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 404 });
    }),
  );
});

const lookup = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    apiRequest("POST", "/api/osu/users", null, body, { "x-real-ip": "203.0.113.9", ...headers }),
  );

describe("POST /api/osu/users", () => {
  it("answers users in the order asked, each once, and names the unknown ones", async () => {
    const response = await lookup({
      names: ["cookiezi", "2", "nobody_here", "https://osu.ppy.sh/users/2", "bad!name"],
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({
      users: [
        { id: 124493, username: "Cookiezi", countryCode: "KR" },
        { id: 2, username: "peppy", countryCode: "AU" },
      ],
      notFound: ["nobody_here", "bad!name"],
      unchecked: [],
    });
    expect(calls.filter((url) => url.includes("ids"))).toHaveLength(1);
  });

  it("keeps answers: a second lookup asks osu! nothing", async () => {
    await lookup({ names: ["peppy", "999", "ghost"] });
    const first = calls.length;
    const again = await lookup({ names: ["2", "PEPPY", "999", "ghost"] });
    expect(calls).toHaveLength(first);
    expect((await again.json()).notFound).toEqual(["999", "ghost"]);
    const rows = await (await osuUsersCollection()).find().toArray();
    const peppy = rows.find((row) => row._id === "id:2");
    const ghost = rows.find((row) => row._id === "name:ghost");
    const hours = (row?: { expiresAt: Date }) =>
      ((row?.expiresAt.getTime() ?? 0) - Date.now()) / 36e5;
    expect(hours(peppy)).toBeGreaterThan(23);
    expect(hours(ghost)).toBeLessThanOrEqual(1);
  });

  it("refuses bad bodies and more than 64 names", async () => {
    expect((await lookup({ names: [] })).status).toBe(400);
    expect((await lookup({ names: Array(65).fill("peppy") })).status).toBe(400);
    expect((await lookup({ names: ["peppy"], extra: 1 })).status).toBe(400);
    expect((await lookup("not json")).status).toBe(400);
  });

  it("refuses another site", async () => {
    expect((await lookup({ names: ["peppy"] }, CROSS_SITE)).status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("allows 20 lookups a minute per IP", async () => {
    for (let i = 0; i < 20; i++) expect((await lookup({ names: ["2"] })).status).toBe(200);
    expect((await lookup({ names: ["2"] })).status).toBe(429);
    expect((await lookup({ names: ["2"] }, { "x-real-ip": "203.0.113.10" })).status).toBe(200);
  });

  it("leaves names unchecked once the IP's osu! share is spent", async () => {
    const names = Array.from({ length: 25 }, (_, i) => `user${i}`);
    const answer = await (await lookup({ names })).json();
    expect(answer.notFound).toHaveLength(20);
    expect(answer.unchecked).toEqual(names.slice(20));
  });

  it("is 503 when osu! fails", async () => {
    server.use(
      http.get(
        "https://osu.ppy.sh/api/v2/users/:user",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const response = await lookup({ names: ["someone"] });
    expect(response.status).toBe(503);
  });
});
