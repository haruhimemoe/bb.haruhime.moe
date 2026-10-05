/**
 * @file tests/unit/utils/collab.test.ts
 * @desc The collab maker's state: adding, editing, reordering, moving, removing and linking
 *       regions; the [imagemap] it writes (validated first), and reading one back (round trip).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { parseImagemap } from "@haruhimemoe/bbcode/imagemap";
import { describe, expect, it } from "vitest";
import {
  type CollabAction,
  type CollabState,
  collabOutput,
  collabReducer,
  EMPTY_COLLAB,
  importImagemap,
  problemFor,
} from "@/utils/collab";

const IMAGE = "https://i.example.com/collab.png";

const run = (...actions: CollabAction[]): CollabState =>
  actions.reduce(collabReducer, { ...EMPTY_COLLAB, image: IMAGE });

const counter = () => {
  let n = 0;
  return () => `r${++n}`;
};

describe("collabReducer", () => {
  it("adds a region fitted to the image, linking nowhere, and selects it", () => {
    const state = run({ type: "add", id: "a", rect: { x: 95, y: 10, w: 20, h: 0.1 } });
    expect(state.regions).toEqual([{ id: "a", x: 80, y: 10, w: 20, h: 1, href: "#", title: "" }]);
    expect(state.selected).toBe("a");
  });

  it("changes a region's box, link and title", () => {
    const state = run(
      { type: "add", id: "a", rect: { x: 0, y: 0, w: 10, h: 10 } },
      { type: "rect", id: "a", rect: { x: 5, y: 5, w: 20.123, h: 10 } },
      { type: "field", id: "a", field: "href", value: "https://osu.ppy.sh/users/2" },
      { type: "field", id: "a", field: "title", value: "peppy" },
    );
    expect(state.regions[0]).toMatchObject({ x: 5, w: 20.12, href: "https://osu.ppy.sh/users/2" });
    expect(state.regions[0]?.title).toBe("peppy");
  });

  it("reorders within bounds and removes, unselecting the removed region", () => {
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const three = run(
      { type: "add", id: "a", rect },
      { type: "add", id: "b", rect },
      { type: "add", id: "c", rect },
    );
    const ids = (state: CollabState) => state.regions.map((region) => region.id);
    expect(ids(collabReducer(three, { type: "reorder", id: "c", by: -1 }))).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(collabReducer(three, { type: "reorder", id: "a", by: -1 })).toBe(three);
    expect(collabReducer(three, { type: "reorder", id: "c", by: 1 })).toBe(three);
    const removed = collabReducer(three, { type: "remove", id: "c" });
    expect(ids(removed)).toEqual(["a", "b"]);
    expect(removed.selected).toBeNull();
    const kept = collabReducer(collabReducer(three, { type: "select", id: "a" }), {
      type: "remove",
      id: "b",
    });
    expect(kept.selected).toBe("a");
  });

  it("moves a region to any place, and leaves the state alone for no move", () => {
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const three = run(
      { type: "add", id: "a", rect },
      { type: "add", id: "b", rect },
      { type: "add", id: "c", rect },
    );
    const ids = (state: CollabState) => state.regions.map((region) => region.id);
    expect(ids(collabReducer(three, { type: "move", id: "a", to: 2 }))).toEqual(["b", "c", "a"]);
    expect(ids(collabReducer(three, { type: "move", id: "c", to: 0 }))).toEqual(["c", "a", "b"]);
    expect(collabReducer(three, { type: "move", id: "a", to: 0 })).toBe(three);
    expect(collabReducer(three, { type: "move", id: "a", to: 3 })).toBe(three);
    expect(collabReducer(three, { type: "move", id: "z", to: 1 })).toBe(three);
  });

  it("puts links on the first regions in order and leaves the rest", () => {
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const state = run(
      { type: "add", id: "a", rect },
      { type: "add", id: "b", rect },
      { type: "links", links: [{ href: "https://osu.ppy.sh/users/2", title: "peppy" }] },
    );
    expect(state.regions.map((region) => region.title)).toEqual(["peppy", ""]);
  });

  it("changes the image and loads a whole state", () => {
    expect(run({ type: "image", image: "https://x.example/a.png" }).image).toBe(
      "https://x.example/a.png",
    );
    expect(run({ type: "load", state: EMPTY_COLLAB })).toBe(EMPTY_COLLAB);
  });
});

describe("collabOutput", () => {
  it("writes the [imagemap] block osu! accepts", () => {
    const state = run(
      { type: "add", id: "a", rect: { x: 0, y: 0, w: 50, h: 100 } },
      { type: "add", id: "b", rect: { x: 50, y: 0, w: 33.33, h: 12.5 } },
      { type: "field", id: "a", field: "href", value: " https://osu.ppy.sh/users/2 " },
      { type: "field", id: "a", field: "title", value: "peppy" },
    );
    const { bbcode, problems } = collabOutput(state);
    expect(problems).toEqual([]);
    expect(bbcode).toBe(
      `[imagemap]\n${IMAGE}\n0 0 50 100 https://osu.ppy.sh/users/2 peppy\n50 0 33.33 12.5 #\n[/imagemap]`,
    );
    expect(parseImagemap(bbcode ?? "").ok).toBe(true);
  });

  it("names each problem instead of writing a bad block", () => {
    const state = run(
      { type: "image", image: "ftp://nope" },
      { type: "add", id: "a", rect: { x: 0, y: 0, w: 10, h: 10 } },
      { type: "field", id: "a", field: "href", value: "javascript:alert(1)" },
    );
    const { bbcode, problems } = collabOutput(state);
    expect(bbcode).toBeNull();
    expect(problemFor(problems, "image")).toMatch(/http/);
    expect(problemFor(problems, "regions.0.href")).toBeDefined();
    expect(problemFor(collabOutput({ ...EMPTY_COLLAB, image: IMAGE }).problems, "regions")).toBe(
      "Add at least one region.",
    );
  });
});

describe("importImagemap", () => {
  it("reads back what collabOutput wrote (round trip)", () => {
    const state = run(
      { type: "add", id: "a", rect: { x: 12.5, y: 7.25, w: 20, h: 30 } },
      { type: "field", id: "a", field: "title", value: "someone" },
      { type: "add", id: "b", rect: { x: 60, y: 60, w: 40, h: 40 } },
      { type: "field", id: "b", field: "href", value: "mailto:me@example.com" },
    );
    const written = collabOutput(state).bbcode ?? "";
    const read = importImagemap(written, counter());
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.state.regions.map(({ id: _, ...rest }) => rest)).toEqual(
      state.regions.map(({ id: _, ...rest }) => rest),
    );
    expect(collabOutput(read.state).bbcode).toBe(written);
  });

  it("takes only the inside of the block too, and fits odd boxes", () => {
    const read = importImagemap(`${IMAGE}\n90 0 20 0.25 #\n`, counter());
    expect(read.ok && read.state.regions[0]).toMatchObject({ id: "r1", x: 80, w: 20, h: 1 });
    expect(importImagemap(`  ${IMAGE}\n0 0 10 10 # hi  `, counter()).ok).toBe(true);
  });

  it("reports what osu! would refuse", () => {
    const read = importImagemap("[imagemap]\nnot a url\n0 0 10 10 #\n[/imagemap]", counter());
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.issues.length).toBeGreaterThan(0);
  });
});
