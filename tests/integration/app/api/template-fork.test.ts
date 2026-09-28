/**
 * @file tests/integration/app/api/template-fork.test.ts
 * @desc POST /api/templates/<id>/fork: a signed-in user copies a template they can see (built-in
 *       ones included) into a private one of their own; one they can't see is 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/[id]/fork/route";
import { templatesCollection } from "@/models/Template";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const fork = (cookie: string | null, id: string, headers = {}) =>
  POST(apiRequest("POST", `/api/templates/${id}/fork`, cookie, undefined, headers), params({ id }));

type Answer = { template: Record<string, unknown> };

describe("POST /api/templates/<id>/fork", () => {
  it("copies a public template into a private one of the caller's", async () => {
    const { other } = await createCast();
    await insertTemplate({ _id: "t-source01", name: "Cup post", body: "[b]x[/b]", uses: 9 });
    const response = await fork(other.cookie, "t-source01");
    expect(response.status).toBe(201);
    const { template } = (await response.json()) as Answer;
    expect(template).toMatchObject({
      name: "Cup post (copy)",
      body: "[b]x[/b]",
      visibility: "private",
      ownerOsuId: other.osuId,
      forkOf: "t-source01",
      uses: 0,
    });
  });

  it("copies a built-in template", async () => {
    const { other } = await createCast();
    const response = await fork(other.cookie, "bb-tournament-forum-post");
    expect(response.status).toBe(201);
    const { template } = (await response.json()) as Answer;
    expect(template).toMatchObject({
      name: "Tournament forum post (copy)",
      kind: "tournament",
      forkOf: "bb-tournament-forum-post",
    });
    expect((template.fields as unknown[]).length).toBeGreaterThan(5);
  });

  it("is 404 for a private, hidden or missing template, and 401 for a visitor", async () => {
    const { other, owner } = await createCast();
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    await insertTemplate({ _id: "t-hidden01", hidden: true, reports: 3 });
    expect((await fork(other.cookie, "t-private1")).status).toBe(404);
    expect((await fork(other.cookie, "t-hidden01")).status).toBe(404);
    expect((await fork(other.cookie, "bb-nothing")).status).toBe(404);
    expect((await fork(null, "bb-userpage-simple")).status).toBe(401);
    expect((await fork(owner.cookie, "t-private1", CROSS_SITE)).status).toBe(403);
    // The owner can fork their own private template.
    expect((await fork(owner.cookie, "t-private1")).status).toBe(201);
  });

  it("refuses a copy of a template today's filter refuses", async () => {
    const { other } = await createCast();
    await insertTemplate({ _id: "t-oldrule1", body: "sieg heil" });
    const response = await fork(other.cookie, "t-oldrule1");
    expect(response.status).toBe(400);
    expect(await (await templatesCollection()).countDocuments({ ownerOsuId: other.osuId })).toBe(0);
  });
});
