/**
 * @file tests/unit/utils/docs-seo.test.ts
 * @desc The docs' search titles, descriptions and JSON-LD: guides and tags as TechArticles with
 *       dateModified and breadcrumbs, and /docs's FAQPage matching the visible questions.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { GUIDE_SLUGS, GUIDES } from "@/constants/guides";
import { tagBySlug } from "@/utils/docs";
import { docsLd, guideLd, tagLd, tagSeoDescription, tagSeoTitle } from "@/utils/docs-seo";

const imagemap = tagBySlug("imagemap");

describe("docs seo", () => {
  it.each(GUIDE_SLUGS)("gives %s a search title and a 140-160 character summary", (slug) => {
    const guide = GUIDES[slug];
    expect(`${guide.seoTitle} · bb.haruhime.moe`.length).toBeLessThanOrEqual(60);
    expect(guide.summary.length).toBeGreaterThanOrEqual(140);
    expect(guide.summary.length).toBeLessThanOrEqual(160);
    expect(guide.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("makes a guide a TechArticle with dateModified and breadcrumbs", () => {
    const [article, crumbs] = guideLd("userpage")["@graph"];
    expect(article).toMatchObject({
      "@type": "TechArticle",
      headline: "How to make an osu! userpage",
      url: "https://bb.haruhime.moe/docs/guides/userpage",
    });
    expect(article?.dateModified).toMatch(/^2026-09-28/);
    expect(crumbs?.["@type"]).toBe("BreadcrumbList");
  });

  it("titles and describes every tag from its data", () => {
    expect(imagemap && tagSeoTitle(imagemap)).toBe("osu! [imagemap] tag: syntax and examples");
    for (const tag of TAGS) {
      const text = tagSeoDescription(tag);
      expect(text.length).toBeGreaterThan(60);
      expect(text.length).toBeLessThanOrEqual(160);
    }
  });

  it("makes a tag a TechArticle about the tag", () => {
    if (!imagemap) throw new Error("no imagemap tag");
    const [article] = tagLd(imagemap)["@graph"];
    expect(article).toMatchObject({ "@type": "TechArticle" });
    expect(JSON.stringify(article)).toContain("[imagemap]");
  });

  it("sends the visible questions as the FAQPage", () => {
    const [faq, list] = docsLd()["@graph"];
    expect(faq?.["@type"]).toBe("FAQPage");
    expect(JSON.stringify(faq)).toContain(DOCS_FAQ[1]?.question);
    expect(DOCS_FAQ.length).toBe(8);
    expect(list?.["@type"]).toBe("ItemList");
  });
});
