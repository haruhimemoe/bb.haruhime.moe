/**
 * @file tests/unit/lib/signout.test.ts
 * @desc Satellite sign-out: only the session token cookie is forwarded to the hub, with bb's
 *       Origin and redirect "manual"; no cookie means no hub call; a refusal or an unreachable
 *       hub reads as false; every better-auth cookie (__Secure- and bare) and the marker are
 *       cleared on the configured domain, host-only without one.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

import { describe, expect, it, vi } from "vitest";
import { clearAuthCookies, sessionCookieHeader, signOutOnHub } from "@/lib/signout";

const TOKEN = "__Secure-better-auth.session_token=abc.sig%3D";

describe("sessionCookieHeader", () => {
  it("keeps only the session token cookies", () => {
    expect(sessionCookieHeader(`theme=dark; ${TOKEN}; better-auth.session_data=x; other=1`)).toBe(
      TOKEN,
    );
    expect(sessionCookieHeader("better-auth.session_token=a.b")).toBe(
      "better-auth.session_token=a.b",
    );
    expect(sessionCookieHeader("better-auth.session_token_x=a")).toBeNull();
    expect(sessionCookieHeader("theme=dark")).toBeNull();
    expect(sessionCookieHeader(null)).toBeNull();
  });
});

describe("signOutOnHub", () => {
  it("posts only the session cookie with bb's Origin", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await signOutOnHub(`a=1; ${TOKEN}`, "https://www.haruhime.moe", fetchImpl)).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.href).toBe("https://www.haruhime.moe/api/auth/sign-out");
    expect(init).toMatchObject({
      method: "POST",
      redirect: "manual",
      headers: { cookie: TOKEN, origin: "https://bb.haruhime.moe" },
    });
  });

  it("skips the hub without a session cookie", async () => {
    const fetchImpl = vi.fn();
    expect(await signOutOnHub("a=1", "https://www.haruhime.moe", fetchImpl)).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads a refusal or a network error as false", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const refused = vi.fn(async () => new Response(null, { status: 403 }));
    expect(await signOutOnHub(TOKEN, "https://www.haruhime.moe", refused)).toBe(false);
    const down = vi.fn(async () => {
      throw new Error("down");
    });
    expect(await signOutOnHub(TOKEN, "https://www.haruhime.moe", down)).toBe(false);
    error.mockRestore();
  });
});

describe("clearAuthCookies", () => {
  it("expires every hub cookie and the marker on the domain", () => {
    const cookies = clearAuthCookies(".haruhime.moe");
    for (const name of ["session_token", "session_data", "dont_remember"]) {
      expect(cookies).toContainEqual(
        expect.stringMatching(new RegExp(`^__Secure-better-auth\\.${name}=;.*Secure`)),
      );
      expect(cookies).toContainEqual(expect.stringMatching(new RegExp(`^better-auth\\.${name}=;`)));
    }
    expect(cookies).toContainEqual(expect.stringMatching(/^haruhime-signed-in=;/));
    for (const cookie of cookies) {
      expect(cookie).toContain("Max-Age=0");
      expect(cookie).toContain("Domain=.haruhime.moe");
    }
  });

  it("is host-only without a domain", () => {
    for (const cookie of clearAuthCookies(undefined)) expect(cookie).not.toContain("Domain=");
  });
});
