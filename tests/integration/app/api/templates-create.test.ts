/**
 * @file tests/integration/app/api/templates-create.test.ts
 * @desc POST /api/templates: signed in, same site, JSON the content schema accepts (the content
 *       filter on name, description, body and field labels), 30 writes a minute per user, and at
 *       most 100 templates per account.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/route";
import { templatesCollection } from "@/models/Template";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast } from "../../../helpers/requests";
import { insertTemplate, validBody } from "../../../helpers/templates";

setupTestDb();

const create = (cookie: string | null, body: unknown = validBody(), headers = {}) =>
  POST(apiRequest("POST", "/api/templates", cookie, body, headers));

const errorOf = async (response: Response) =>
  ((await response.json()) as { error: { code: string; message: string } }).error;

describe("POST /api/templates", () => {
  it("makes a private template owned by the caller, version 1", async () => {
    const { owner } = await createCast();
    const response = await create(owner.cookie);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { template } = (await response.json()) as { template: Record<string, unknown> };
    expect(template).toMatchObject({
      name: "My userpage",
      visibility: "private",
      ownerOsuId: owner.osuId,
      ownerName: owner.username,
      version: 1,
      uses: 0,
      builtIn: false,
      forkOf: null,
    });
    expect(template.id).toMatch(/^t-[a-z0-9]{8}$/);
    const stored = await (await templatesCollection()).findOne({ _id: template.id as string });
    expect(stored).toMatchObject({ reports: 0, hidden: false });
  });

  it("takes a visibility", async () => {
    const { owner } = await createCast();
    const response = await create(owner.cookie, validBody({ visibility: "public" }));
    expect(
      ((await response.json()) as { template: { visibility: string } }).template.visibility,
    ).toBe("public");
  });

  it("refuses a visitor with 401 and another site with 403", async () => {
    const { owner } = await createCast();
    expect((await create(null)).status).toBe(401);
    expect((await create(owner.cookie, validBody(), CROSS_SITE)).status).toBe(403);
    expect(await (await templatesCollection()).countDocuments()).toBe(0);
  });

  it("refuses a body that isn't JSON, a loose body and bad content", async () => {
    const { owner } = await createCast();
    const notJson = await POST(
      new Request("http://localhost:3000/api/templates", {
        method: "POST",
        headers: { cookie: owner.cookie, "content-type": "text/plain" },
        body: "hi",
      }),
    );
    expect(notJson.status).toBe(415);
    expect((await create(owner.cookie, validBody({ extra: 1 }))).status).toBe(400);
    expect((await create(owner.cookie, validBody({ name: "ab" }))).status).toBe(400);
    expect((await create(owner.cookie, validBody({ body: "   " }))).status).toBe(400);
    expect((await create(owner.cookie, validBody({ kind: "song" }))).status).toBe(400);
    const dupe = validBody({
      fields: [
        { key: "a", label: "A", kind: "text", required: false, default: "" },
        { key: "a", label: "B", kind: "text", required: false, default: "" },
      ],
    });
    expect(await errorOf(await create(owner.cookie, dupe))).toMatchObject({
      message: "Two fields have the same key.",
    });
  });

  it.each([
    ["name", { name: "sieg heil cup" }],
    ["description", { description: "sieg heil" }],
    ["body", { body: "[b]sieg heil[/b]" }],
  ])("runs the %s through the content filter", async (_, change) => {
    const { owner } = await createCast();
    const response = await create(owner.cookie, validBody(change));
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toMatchObject({ code: "content_filter" });
  });

  it("keeps an account at 100 templates", async () => {
    const { owner } = await createCast();
    const rows = Array.from({ length: 100 }, (_, i) => ({
      _id: `t-cap${String(i).padStart(5, "0")}`,
    }));
    for (const row of rows) await insertTemplate({ ...row, ownerOsuId: owner.osuId });
    const response = await create(owner.cookie);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toMatchObject({ code: "template_limit" });
    expect(await (await templatesCollection()).countDocuments({ ownerOsuId: owner.osuId })).toBe(
      100,
    );
  });

  it("allows 30 writes a minute per user, then 429", async () => {
    const { owner, other } = await createCast();
    for (let i = 0; i < 30; i++) expect((await create(owner.cookie)).status).toBe(201);
    const limited = await create(owner.cookie);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/);
    expect((await create(other.cookie)).status).toBe(201);
  });
});
