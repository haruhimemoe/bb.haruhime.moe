/**
 * @file tests/integration/app/api/forum-import.test.ts
 * @desc GET /api/osu/import against msw's osu!: a topic's first post, a post by ?start=, a post
 *       link resolved through its redirect, a userpage by name or id, the 400s (bad refs, a
 *       redirect elsewhere), the 404s (missing, deleted, empty), the CDN cache, the per-IP limit
 *       and osu! failing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/osu/import/route";
import topic from "../../../fixtures/osu/forum-topic.json";
import userPage from "../../../fixtures/osu/user-page.json";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest } from "../../../helpers/requests";

setupTestDb();
const server = setupMsw();
const first = topic.posts[0] as (typeof topic.posts)[number];
const TOPIC_URL = `https://osu.ppy.sh/community/forums/topics/${topic.topic.id}`;
let topicQueries: URLSearchParams[] = [];
let heads = 0;

beforeEach(() => {
  topicQueries = [];
  heads = 0;
  server.use(
    http.post("https://osu.ppy.sh/oauth/token", () =>
      HttpResponse.json({ access_token: "t", token_type: "Bearer", expires_in: 86400 }),
    ),
    http.get("https://osu.ppy.sh/api/v2/forums/topics/:id", ({ params, request }) => {
      const query = new URL(request.url).searchParams;
      topicQueries.push(query);
      if (Number(params.id) !== topic.topic.id) {
        return HttpResponse.json({ error: "not found" }, { status: 404 });
      }
      const start = Number(query.get("start") ?? 0);
      const posts = topic.posts.filter((post) => post.id >= start).slice(0, 1);
      return HttpResponse.json({ ...topic, posts });
    }),
    http.get("https://osu.ppy.sh/api/v2/users/:user", ({ params }) =>
      params.user === "@peppy" || params.user === "2"
        ? HttpResponse.json(userPage)
        : HttpResponse.json({ error: "not found" }, { status: 404 }),
    ),
  );
});

const get = (ref: string, ip = "203.0.113.30") =>
  GET(
    apiRequest("GET", `/api/osu/import?ref=${encodeURIComponent(ref)}`, null, undefined, {
      "x-real-ip": ip,
    }),
  );

const redirectTo = (location: string, status = 302) =>
  server.use(
    http.head("https://osu.ppy.sh/community/forums/posts/:id", () => {
      heads += 1;
      return new HttpResponse(null, { status, headers: { location } });
    }),
  );

describe("GET /api/osu/import", () => {
  it("imports a topic's first post, cached on the CDN", async () => {
    const response = await get(TOPIC_URL);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=300");
    expect(await response.json()).toEqual({
      source: { kind: "post", title: topic.topic.title, url: `${TOPIC_URL}?start=${first.id}` },
      bbcode: first.body.raw,
    });
    expect(topicQueries[0]?.get("sort")).toBe("id_asc");
    expect(topicQueries[0]?.get("limit")).toBe("1");
  });

  it("imports a post by ?start=", async () => {
    const second = topic.posts[1] as (typeof topic.posts)[number];
    const response = await get(`${TOPIC_URL}?start=${second.id}`);
    expect(response.status).toBe(200);
    expect((await response.json()).bbcode).toBe(second.body.raw);
    expect(topicQueries[0]?.get("start")).toBe(String(second.id));
  });

  it("404s a ?start= that lands on a different post", async () => {
    const response = await get(`${TOPIC_URL}?start=${first.id + 1}`);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("404s a topic osu! doesn't have", async () => {
    expect((await get("https://osu.ppy.sh/community/forums/topics/1")).status).toBe(404);
  });

  it("follows a post link's redirect header to its topic", async () => {
    redirectTo(`${TOPIC_URL}?start=${first.id}#forum-post-${first.id}`);
    const response = await get(`https://osu.ppy.sh/community/forums/posts/${first.id}`);
    expect(response.status).toBe(200);
    expect((await response.json()).source.title).toBe(topic.topic.title);
    expect(heads).toBe(1);
  });

  it("400s a post link whose redirect goes anywhere but a topic", async () => {
    redirectTo("https://osu.ppy.sh/home");
    const response = await get("https://osu.ppy.sh/community/forums/posts/1");
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toContain("Paste the topic link");
  });

  it("400s a post link osu! answers without a redirect", async () => {
    server.use(
      http.head(
        "https://osu.ppy.sh/community/forums/posts/:id",
        () => new HttpResponse(null, { status: 200 }),
      ),
    );
    expect((await get("https://osu.ppy.sh/community/forums/posts/1")).status).toBe(400);
  });

  it("404s a post link osu! says doesn't exist", async () => {
    server.use(
      http.head(
        "https://osu.ppy.sh/community/forums/posts/:id",
        () => new HttpResponse(null, { status: 404 }),
      ),
    );
    expect((await get("https://osu.ppy.sh/community/forums/posts/1")).status).toBe(404);
  });

  it("503s when the post link's HEAD fails", async () => {
    server.use(
      http.head("https://osu.ppy.sh/community/forums/posts/:id", () => HttpResponse.error()),
    );
    expect((await get("https://osu.ppy.sh/community/forums/posts/1")).status).toBe(503);
  });

  it("imports a userpage by name, @id and profile link", async () => {
    for (const ref of ["peppy", "@2", "https://osu.ppy.sh/users/2"]) {
      const response = await get(ref);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.source).toEqual({
        kind: "userpage",
        title: `${userPage.username}'s userpage`,
        url: `https://osu.ppy.sh/users/${userPage.id}`,
      });
      expect(body.bbcode).toBe(userPage.page.raw);
    }
  });

  it("404s a missing user, an empty page and a deleted post", async () => {
    expect((await get("nobody_here")).status).toBe(404);
    server.use(
      http.get("https://osu.ppy.sh/api/v2/users/:user", () =>
        HttpResponse.json({ ...userPage, page: { raw: "  ", html: "" } }),
      ),
    );
    expect((await get("peppy")).status).toBe(404);
    server.use(
      http.get("https://osu.ppy.sh/api/v2/forums/topics/:id", () =>
        HttpResponse.json({ ...topic, posts: [{ ...first, body: null }] }),
      ),
    );
    expect((await get(TOPIC_URL)).status).toBe(404);
  });

  it("400s what isn't a ref, before any call", async () => {
    const response = await get("https://example.com/x");
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(topicQueries).toEqual([]);
  });

  it("refuses the 21st import in a minute from one IP", async () => {
    for (let i = 0; i < 20; i += 1) expect((await get("@2", "203.0.113.31")).status).toBe(200);
    expect((await get("@2", "203.0.113.31")).status).toBe(429);
  });

  it("503s when osu! keeps failing", async () => {
    server.use(
      http.get("https://osu.ppy.sh/api/v2/users/:user", () =>
        HttpResponse.json({ error: "boom" }, { status: 400 }),
      ),
    );
    const response = await get("peppy");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
