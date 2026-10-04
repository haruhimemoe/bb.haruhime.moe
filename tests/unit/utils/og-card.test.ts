/**
 * @file tests/unit/utils/og-card.test.ts
 * @desc Link preview cards: what a template's, guide's and tag's card says, and the versioned
 *       <path>/og.png image.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { CONTENT } from "@/constants/content";
import { cardImage, guideCard, tagCard, templateCard } from "@/utils/og-card";

const TEMPLATE = {
  name: "Clean userpage",
  kind: "userpage",
  fields: [{ key: "name" }, { key: "bio" }],
  builtIn: false,
  ownerName: "Chiyo",
} as unknown as Parameters<typeof templateCard>[0];

describe("templateCard", () => {
  it("says the kind, the name, the owner and the fields", () => {
    expect(templateCard(TEMPLATE)).toEqual({
      eyebrow: "osu! userpage template",
      title: "Clean userpage",
      subtitle: "By Chiyo · 2 fields",
    });
  });

  it("says Built in for bb's own and BBCode for other kinds", () => {
    const card = templateCard({ ...TEMPLATE, builtIn: true, kind: "other", fields: [] });
    expect(card).toMatchObject({
      eyebrow: "osu! BBCode template",
      subtitle: "Built in · ready to copy",
    });
  });
});

describe("guideCard and tagCard", () => {
  it("takes a guide's title and description", () => {
    const [guide] = CONTENT.entries.guides;
    if (!guide) throw new Error("no guides");
    expect(guideCard(guide)).toEqual({
      eyebrow: "bb guide",
      title: guide.title,
      subtitle: guide.description,
    });
  });

  it("names a tag with its brackets", () => {
    const [tag] = TAGS;
    if (!tag) throw new Error("no tags");
    expect(tagCard(tag).title.startsWith(`[${tag.name}] `)).toBe(true);
    expect(tagCard(tag).subtitle).not.toContain("`");
  });
});

describe("cardImage", () => {
  it("links <path>/og.png, versioned by the card's text", () => {
    const image = cardImage("/t/t-00000001", templateCard(TEMPLATE));
    expect(image).toMatchObject({ width: 1200, height: 630, type: "image/png" });
    expect(image.url).toMatch(/^\/t\/t-00000001\/og\.png\?v=\w+$/);
    expect(cardImage("/t/t-00000001", templateCard({ ...TEMPLATE, name: "Other" })).url).not.toBe(
      image.url,
    );
  });
});
