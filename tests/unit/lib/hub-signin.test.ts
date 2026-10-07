/**
 * @file tests/unit/lib/hub-signin.test.ts
 * @desc hubSignInHref: the hub's /api/signin/osu (straight to osu!, no hub page) with an
 *       absolute bb `next`; an unsafe or missing path falls back to /me.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUserFromHeaders: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

const { hubSignInHref } = await import("@/lib/auth-session");

const direct = (next: string) =>
  `https://www.haruhime.moe/api/signin/osu?next=${encodeURIComponent(next)}`;

beforeEach(() => vi.unstubAllEnvs());

describe("hubSignInHref", () => {
  it("goes to the hub's direct sign-in with an absolute bb next", () => {
    expect(hubSignInHref("/templates/abc?x=1")).toBe(
      direct("https://bb.haruhime.moe/templates/abc?x=1"),
    );
  });

  it.each([null, undefined, "//evil.com", "https://evil.com/"])(
    "falls back to /me for %s",
    (next) => {
      expect(hubSignInHref(next)).toBe(direct("https://bb.haruhime.moe/me"));
    },
  );

  it("follows HUB_URL", () => {
    vi.stubEnv("HUB_URL", "http://localhost:3001");
    expect(hubSignInHref("/me")).toBe(
      `http://localhost:3001/api/signin/osu?next=${encodeURIComponent("https://bb.haruhime.moe/me")}`,
    );
  });
});
