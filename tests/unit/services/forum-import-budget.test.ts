/**
 * @file tests/unit/services/forum-import-budget.test.ts
 * @desc GET /api/osu/import when the osu! budget says no: the service lets osu!'s "budget" error
 *       through and the route answers 429, no-store, without calling osu!.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { OsuApiError } from "@haruhimemoe/osu";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ limitIp: async () => null }));
vi.mock("@/lib/osu", async () => {
  const { createOsuClient, OsuApiError: Err } = await import("@haruhimemoe/osu");
  const fetch = vi.fn(async () => new Response("{}", { status: 500 }));
  const client = createOsuClient({
    userAgent: "test",
    credentials: { clientId: "1", clientSecret: "s" },
    fetch,
  });
  return {
    OsuApiError: Err,
    getOsuClient: () => client,
    osuBudget: { gate: () => async () => false },
    fetchSpy: fetch,
  };
});

const { GET } = await import("@/app/api/osu/import/route");
const { importFromRef } = await import("@/services/forum-import");
const osu = (await import("@/lib/osu")) as unknown as { fetchSpy: ReturnType<typeof vi.fn> };

describe("forum import over budget", () => {
  it("lets the budget error through from the service", async () => {
    await expect(
      importFromRef({ kind: "user", user: "peppy" }, async () => false),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof OsuApiError && error.code === "budget",
    );
  });

  it("answers 429 without calling osu!", async () => {
    const response = await GET(new Request("http://localhost:3000/api/osu/import?ref=peppy"));
    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(osu.fetchSpy).not.toHaveBeenCalled();
  });
});
