/**
 * @file tests/unit/app/api/signout-route.test.ts
 * @desc POST /api/signout: refuses a cross-site or sibling-subdomain request without calling
 *       the hub; otherwise ends the hub session and answers 204 clearing the cookies on
 *       HUB_COOKIE_DOMAIN, even when the hub fails.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const signOutOnHub = vi.fn();
vi.mock("@/lib/signout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/signout")>()),
  signOutOnHub: (cookie: string | null, hub: string) => signOutOnHub(cookie, hub),
}));

const { POST } = await import("@/app/api/signout/route");

const post = (origin: string, cookie = "__Secure-better-auth.session_token=a.b") =>
  POST(
    new Request("https://bb.haruhime.moe/api/signout", {
      method: "POST",
      headers: { origin, cookie },
    }),
  );

beforeEach(() => {
  vi.unstubAllEnvs();
  signOutOnHub.mockReset();
  signOutOnHub.mockResolvedValue(true);
});

describe("POST /api/signout", () => {
  it.each(["https://evil.com", "https://pools.haruhime.moe"])("refuses %s", async (origin) => {
    expect((await post(origin)).status).toBe(403);
    expect(signOutOnHub).not.toHaveBeenCalled();
  });

  it("signs out on the hub and clears the cookies on the domain", async () => {
    vi.stubEnv("HUB_COOKIE_DOMAIN", ".haruhime.moe");
    vi.stubEnv("HUB_URL", "https://www.haruhime.moe");
    const response = await post("https://bb.haruhime.moe");
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(signOutOnHub).toHaveBeenCalledWith(
      "__Secure-better-auth.session_token=a.b",
      "https://www.haruhime.moe",
    );
    const cookies = response.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) expect(cookie).toContain("Domain=.haruhime.moe");
  });

  it("clears the cookies even when the hub fails", async () => {
    signOutOnHub.mockResolvedValue(false);
    const response = await post("https://bb.haruhime.moe");
    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toContainEqual(
      expect.stringMatching(/^haruhime-signed-in=;/),
    );
  });
});
