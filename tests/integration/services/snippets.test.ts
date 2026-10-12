/**
 * @file tests/integration/services/snippets.test.ts
 * @desc Snippets for the editor: the caller's own (any visibility) and the public ones others
 *       share, most used first, never hidden or private ones; a visitor gets only the shared
 *       ones. Plus GET /api/snippets.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/snippets/route";
import { listSnippets } from "@/services/snippets";
import { setupTestDb } from "../../helpers/db";
import { apiRequest, createCast } from "../../helpers/requests";
import { insertTemplate } from "../../helpers/templates";

setupTestDb();

const me = { osuId: 77, isAdmin: false };

describe("listSnippets", () => {
  it("lists the caller's snippets and the public ones others share", async () => {
    await insertTemplate({
      _id: "t-mine0001",
      ownerOsuId: 77,
      kind: "snippet",
      visibility: "private",
    });
    await insertTemplate({ _id: "t-pub00001", kind: "snippet", visibility: "public", uses: 1 });
    await insertTemplate({ _id: "t-pub00002", kind: "snippet", visibility: "public", uses: 9 });
    await insertTemplate({
      _id: "t-hid00001",
      kind: "snippet",
      visibility: "public",
      hidden: true,
    });
    await insertTemplate({ _id: "t-priv0001", kind: "snippet", visibility: "private" });
    await insertTemplate({ _id: "t-page0001", kind: "userpage", visibility: "public" });
    await insertTemplate({ _id: "t-mypage01", ownerOsuId: 77, kind: "userpage" });
    const { mine, shared } = await listSnippets(me);
    expect(mine.map((s) => s.id)).toEqual(["t-mine0001"]);
    expect(shared.map((s) => s.id)).toEqual(["t-pub00002", "t-pub00001"]);
    expect(Object.keys(shared[0] ?? {}).sort()).toEqual(
      ["body", "description", "fields", "id", "name", "ownerName"].sort(),
    );
  });

  it("gives a visitor only the shared ones", async () => {
    await insertTemplate({ _id: "t-pub00003", kind: "snippet", visibility: "public" });
    const { mine, shared, signedIn } = await listSnippets(null);
    expect({ mine, signedIn }).toEqual({ mine: [], signedIn: false });
    expect(shared.map((s) => s.id)).toContain("t-pub00003");
  });
});

describe("GET /api/snippets", () => {
  it("answers with the caller's and the shared snippets, never cached", async () => {
    const { owner } = await createCast();
    await insertTemplate({ _id: "t-own00001", ownerOsuId: owner.osuId, kind: "snippet" });
    const response = await GET(apiRequest("GET", "/api/snippets", owner.cookie));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = (await response.json()) as { mine: { id: string }[]; signedIn: boolean };
    expect(body.signedIn).toBe(true);
    expect(body.mine.map((s) => s.id)).toContain("t-own00001");
  });
});
