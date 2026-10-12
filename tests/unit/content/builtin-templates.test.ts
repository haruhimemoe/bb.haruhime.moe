/**
 * @file tests/unit/content/builtin-templates.test.ts
 * @desc The built-in templates in content/templates load, meet the template rules, declare
 *       every placeholder they use, stay inside osu!'s tag list, and fill cleanly, even with only
 *       their required fields (optional parts drop out through sections).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { lint } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { loadBuiltinTemplates } from "@/lib/builtin-templates";
import { fillTemplate, templateFields } from "@/utils/template-fill";

const OSU_TAGS = new Set(
  "b i u s strike spoiler color size centre left right heading c code notice box spoilerbox quote list * url email img audio youtube profile imagemap".split(
    " ",
  ),
);

const templates = loadBuiltinTemplates();

/** A value each field kind accepts, for filling every field. */
const SAMPLE: Readonly<Record<string, string>> = {
  text: "x",
  multiline: "x\ny",
  number: "3",
  date: "2026-10-01",
  url: "https://osu.ppy.sh",
  user: "peppy",
  users: "peppy\n2",
  country: "JP",
  color: "#ff66aa",
};

describe("built-in templates", () => {
  it("are the eight from the specs", () => {
    expect(templates.map((t) => t.id)).toEqual([
      "bb-beatmap-description",
      "bb-feature-request",
      "bb-tournament-forum-post",
      "bb-tournament-rules-solo",
      "bb-tournament-rules-teams",
      "bb-tournament-staff-list",
      "bb-userpage-sections",
      "bb-userpage-simple",
    ]);
  });

  it.each(templates.map((t) => [t.id, t] as const))(
    "%s fills with only its required fields into BBCode osu! takes",
    (_, t) => {
      const values = Object.fromEntries(
        t.fields.filter((f) => f.required).map((f) => [f.key, SAMPLE[f.kind] ?? "x"]),
      );
      const { text, errors } = fillTemplate(t.body, t.fields, values);
      expect(errors).toEqual([]);
      expect(text).not.toMatch(/\{\{/);
      expect(lint(text).filter((d) => d.severity === "error")).toEqual([]);
      expect(text).not.toMatch(/\[(\w+)(=[^\]]*)?\]\s*\[\/\1\]/);
    },
  );

  it.each(templates.map((t) => [t.id, t] as const))(
    "%s fills with every field into BBCode osu! takes",
    (_, t) => {
      const values = Object.fromEntries(t.fields.map((f) => [f.key, SAMPLE[f.kind] ?? "x"]));
      expect(
        lint(fillTemplate(t.body, t.fields, values).text).filter((d) => d.severity === "error"),
      ).toEqual([]);
    },
  );

  it.each(templates.map((t) => [t.id, t] as const))("%s declares every placeholder", (_, t) => {
    expect(templateFields(t.body, t.fields).undeclared).toEqual([]);
    expect(t.fields.length).toBeGreaterThan(0);
  });

  it.each(templates.map((t) => [t.id, t] as const))("%s uses only osu! tags", (_, t) => {
    const tags = [...t.body.matchAll(/\[\/?([a-z*]+)(?:=[^\]]*)?\]/g)].map((m) => m[1] ?? "");
    expect(tags.filter((tag) => !OSU_TAGS.has(tag))).toEqual([]);
    expect(t.body).not.toContain("[center]");
  });

  it.each(templates.map((t) => [t.id, t] as const))("%s uses osu!'s editor sizes", (_, t) => {
    const sizes = [...t.body.matchAll(/\[size=(\d+)\]/g)].map((m) => Number(m[1]));
    expect(sizes.every((size) => [50, 85, 100, 150].includes(size))).toBe(true);
  });

  it.each(templates.map((t) => [t.id, t] as const))("%s fills every placeholder", (_, t) => {
    const values = Object.fromEntries(t.fields.map((f) => [f.key, SAMPLE[f.kind] ?? "x"]));
    const { text, errors } = fillTemplate(t.body, t.fields, values);
    expect(errors).toEqual([]);
    expect(text).not.toMatch(/\{\{/);
  });

  it("covers the tournament post's sections", () => {
    const post = templates.find((t) => t.id === "bb-tournament-forum-post");
    for (const part of [
      "Information",
      "Schedule",
      "Rules",
      "Prizes",
      "Staff",
      "Mappools",
      "Links",
    ]) {
      expect(post?.body).toContain(part);
    }
  });
});
