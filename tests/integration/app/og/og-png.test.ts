/**
 * @file tests/integration/app/og/og-png.test.ts
 * @desc The link preview card routes: /t/<id>/og.png draws built-in and public, unhidden
 *       templates and 404s the rest; the guide and tag cards draw every guide and tag and 404
 *       anything else. Each card is a 1200×630 PNG.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { GET as guideGET } from "@/app/docs/guides/[guide]/og.png/route";
import { GET as tagGET } from "@/app/docs/tags/[tag]/og.png/route";
import { GET as templateGET } from "@/app/t/[id]/og.png/route";
import { GUIDE_SLUGS } from "@/constants/guides";
import { tagSlug } from "@/utils/docs";
import { setupTestDb } from "../../../helpers/db";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const request = new Request("http://localhost/og.png");
const template = (id: string) => templateGET(request, { params: Promise.resolve({ id }) });

const expectCard = async (response: Response) => {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer);
  expect(String.fromCharCode(...bytes.slice(1, 4))).toBe("PNG");
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
};

describe("GET /t/<id>/og.png", () => {
  it("draws a public template and a built-in one, with a week on the CDN", async () => {
    await insertTemplate({ _id: "t-public01", visibility: "public" });
    const response = await template("t-public01");
    await expectCard(response.clone());
    expect(response.headers.get("cache-control")).toContain("s-maxage=604800");
    await expectCard(await template("bb-tournament-forum-post"));
  });

  it("answers 404 for unlisted, private, hidden and unknown templates", async () => {
    await insertTemplate({ _id: "t-unlist01", visibility: "unlisted" });
    await insertTemplate({ _id: "t-private1", visibility: "private" });
    await insertTemplate({ _id: "t-hidden01", visibility: "public", hidden: true });
    for (const id of ["t-unlist01", "t-private1", "t-hidden01", "t-nothere1", "bb-nope"]) {
      expect((await template(id)).status).toBe(404);
    }
  });
});

describe("guide and tag cards", () => {
  it("draws a guide and a tag, and 404s an unknown slug", async () => {
    const [guide = ""] = GUIDE_SLUGS;
    await expectCard(await guideGET(request, { params: Promise.resolve({ guide }) }));
    const [tag] = TAGS;
    const slug = tag ? tagSlug(tag.name) : "";
    await expectCard(await tagGET(request, { params: Promise.resolve({ tag: slug }) }));
    expect((await guideGET(request, { params: Promise.resolve({ guide: "x" }) })).status).toBe(404);
    expect((await tagGET(request, { params: Promise.resolve({ tag: "x" }) })).status).toBe(404);
  });
});
