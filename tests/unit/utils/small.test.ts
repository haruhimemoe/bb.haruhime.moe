/**
 * @file tests/unit/utils/small.test.ts
 * @desc The small helpers: service answers, reading our API's errors, and uses copy.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it, vi } from "vitest";
import { accept, BUILT_IN, NOT_FOUND, refuse } from "@/utils/answer";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { usesText } from "@/utils/template-text";
import { toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

describe("answers", () => {
  it("builds refusals and values", () => {
    expect(accept(1)).toEqual({ ok: true, value: 1 });
    expect(NOT_FOUND).toMatchObject({ ok: false, status: 404 });
    expect(BUILT_IN).toMatchObject({ status: 403, code: "built_in" });
    const template = toTemplateView(makeTemplate());
    expect(refuse(409, "conflict", "x", template)).toMatchObject({ template });
    expect(refuse(400, "bad", "x")).not.toHaveProperty("template");
  });
});

describe("api client", () => {
  it("reads an error's message, or says what failed with the status", async () => {
    const json = (body: unknown, status = 400) => Response.json(body, { status });
    expect(await errorMessageOf(json({ error: { message: "Nope." } }), "Saving failed")).toBe(
      "Nope.",
    );
    expect(await errorMessageOf(json({ error: {} }, 500), "Saving failed")).toBe(
      "Saving failed (500).",
    );
    expect(await errorMessageOf(new Response("<html>", { status: 502 }), "Saving failed")).toBe(
      "Saving failed (502).",
    );
  });

  it("sends JSON only when there's a body", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    try {
      await sendJson("/api/x", "POST", { a: 1 });
      await sendJson("/api/y", "DELETE");
      expect(fetch).toHaveBeenNthCalledWith(1, "/api/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"a":1}',
      });
      expect(fetch).toHaveBeenNthCalledWith(2, "/api/y", { method: "DELETE" });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("usesText", () => {
  it("says how often", () => {
    expect(usesText(0)).toBe("Not used yet");
    expect(usesText(1)).toBe("Used once");
    expect(usesText(1234)).toBe("Used 1,234 times");
  });
});
