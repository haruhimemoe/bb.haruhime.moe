/**
 * @file tests/components/editor/profile-hover.test.tsx
 * @desc The profile hover's lookup against msw's /api/osu/users (found, unknown, the budget or
 *       the limiter saying no, osu! failing; asked once per name) and the card it builds.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { setupMsw } from "@haruhimemoe/next-kit/testing";
import { HttpResponse, http, type JsonBodyType } from "msw";
import { describe, expect, it, vi } from "vitest";
import { profileCard } from "@/lib/codemirror/profile-hover";
import { lookupProfile, type ProfileResult } from "@/lib/profile-lookup";

const server = setupMsw();
const PEPPY = { id: 2, username: "peppy", countryCode: "AU" };
let calls = 0;

const answer = (body: JsonBodyType, status = 200) =>
  server.use(
    http.post("*/api/osu/users", () => {
      calls++;
      return HttpResponse.json(body, { status });
    }),
  );

const LABELS = {
  loading: (name: string) => `Looking up ${name}`,
  notFound: (name: string) => `No user ${name}`,
  busy: () => "Busy",
  failed: () => "Failed",
  open: () => "Open on osu!",
  id: (id: number) => `ID ${id}`,
};

describe("lookupProfile", () => {
  it("finds a user and asks only once per name", async () => {
    calls = 0;
    answer({ users: [PEPPY], notFound: [], unchecked: [] });
    expect(await lookupProfile("Peppy-once")).toEqual({ kind: "found", user: PEPPY });
    expect(await lookupProfile("peppy-ONCE")).toEqual({ kind: "found", user: PEPPY });
    expect(calls).toBe(1);
  });

  it.each([
    [{ users: [], notFound: ["x"], unchecked: [] }, 200, "missing"],
    [{ users: [], notFound: [], unchecked: ["x"] }, 200, "busy"],
    [{ error: { message: "slow down" } }, 429, "busy"],
    [{ error: { message: "down" } }, 503, "failed"],
    [{ nonsense: true }, 200, "failed"],
  ])("answers %j (%i) as %s", async (body, status, kind) => {
    answer(body, status);
    expect((await lookupProfile(`case-${kind}-${status}-${calls}`)).kind).toBe(kind);
  });

  it("waits a minute after being told to slow down, and asks again after a failure", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    answer({ users: [], notFound: [], unchecked: ["again"] });
    expect((await lookupProfile("again")).kind).toBe("busy");
    answer({ users: [PEPPY], notFound: [], unchecked: [] });
    calls = 0;
    expect((await lookupProfile("again")).kind).toBe("busy");
    expect(calls).toBe(0);
    now.mockReturnValue(1_000_000 + 61_000);
    expect((await lookupProfile("again")).kind).toBe("found");
    answer({ error: { message: "down" } }, 503);
    expect((await lookupProfile("flaky")).kind).toBe("failed");
    answer({ users: [PEPPY], notFound: [], unchecked: [] });
    expect((await lookupProfile("flaky")).kind).toBe("found");
    now.mockRestore();
  });
});

describe("profileCard", () => {
  const card = (result: ProfileResult | null) => profileCard("peppy", result, LABELS);

  it("shows the user with avatar, flag, id and a link to osu!", () => {
    const dom = card({ kind: "found", user: PEPPY });
    expect(dom.textContent).toContain("peppy");
    expect(dom.textContent).toContain("ID 2");
    const images = [...dom.querySelectorAll("img")].map((image) => image.getAttribute("src"));
    expect(images).toEqual(["https://a.ppy.sh/2", expect.stringContaining("AU")]);
    const link = dom.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://osu.ppy.sh/users/2");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("says what went wrong, as text", () => {
    expect(card(null).textContent).toBe("Looking up peppy");
    expect(card({ kind: "missing" }).textContent).toBe("No user peppy");
    expect(card({ kind: "busy" }).textContent).toBe("Busy");
    expect(card({ kind: "failed" }).textContent).toBe("Failed");
    expect(profileCard("<b>x</b>", { kind: "missing" }, LABELS).querySelector("b")).toBeNull();
  });
});
