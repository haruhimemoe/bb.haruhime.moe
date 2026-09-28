/**
 * @file tests/integration/app/api/template-use.test.ts
 * @desc POST /api/templates/<id>/use: no sign-in, same site only, 30 an hour per IP; counts a
 *       template anyone can see (built-in ones in their own collection), 404 for the rest.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/[id]/use/route";
import { builtinUsesCollection, templatesCollection } from "@/models/Template";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const use = (id: string, headers: Record<string, string> = { "x-real-ip": "203.0.113.5" }) =>
  POST(apiRequest("POST", `/api/templates/${id}/use`, null, undefined, headers), params({ id }));

describe("POST /api/templates/<id>/use", () => {
  it("counts a use of a public or unlisted template", async () => {
    await insertTemplate({ _id: "t-public01" });
    await insertTemplate({ _id: "t-unlist01", visibility: "unlisted" });
    expect((await use("t-public01")).status).toBe(204);
    expect((await use("t-public01")).status).toBe(204);
    expect((await use("t-unlist01")).status).toBe(204);
    const templates = await templatesCollection();
    expect((await templates.findOne({ _id: "t-public01" }))?.uses).toBe(2);
    expect((await templates.findOne({ _id: "t-unlist01" }))?.uses).toBe(1);
  });

  it("counts a built-in template's uses in its own collection", async () => {
    expect((await use("bb-userpage-simple")).status).toBe(204);
    const row = await (await builtinUsesCollection()).findOne({ _id: "bb-userpage-simple" });
    expect(row?.uses).toBe(1);
  });

  it("is 404 for a private, hidden or unknown template", async () => {
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    await insertTemplate({ _id: "t-hidden01", hidden: true });
    for (const id of ["t-private1", "t-hidden01", "t-missing1", "bb-nothing", "junk"]) {
      expect((await use(id)).status).toBe(404);
    }
    expect((await (await templatesCollection()).findOne({ _id: "t-private1" }))?.uses).toBe(0);
  });

  it("refuses another site", async () => {
    await insertTemplate({ _id: "t-public01" });
    expect((await use("t-public01", CROSS_SITE)).status).toBe(403);
  });

  it("counts at most 30 uses an hour per IP", async () => {
    await insertTemplate({ _id: "t-public01" });
    for (let i = 0; i < 30; i++) expect((await use("t-public01")).status).toBe(204);
    expect((await use("t-public01")).status).toBe(429);
    expect((await use("t-public01", { "x-real-ip": "203.0.113.6" })).status).toBe(204);
  });
});
