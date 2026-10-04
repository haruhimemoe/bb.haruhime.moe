/**
 * @file tests/unit/utils/docs-seo.test.ts
 * @desc The docs' search titles, descriptions and JSON-LD: guides and tags as TechArticles with
 *       dateModified and breadcrumbs, and /docs's FAQPage matching the visible questions.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { TAGS } from "@haruhimemoe/bbcode";
import { describe, expect, it } from "vitest";
import { CONTENT, GUIDE_SEO_TITLES } from "@/constants/content";
import { DOCS_FAQ } from "@/constants/docs-faq";
import { tagBySlug } from "@/utils/docs";
import { contentLd, docsLd, tagLd, tagSeoDescription, tagSeoTitle } from "@/utils/docs-seo";

const imagemap = tagBySlug("imagemap");

describe("docs seo", () => {
  it.each(CONTENT.entries.guides.map((e) => e.slug))(
    "gives %s a search title and a 140-160 character description",
    (slug) => {
      const guide = CONTENT.entries.guides.find((e) => e.slug === slug);
      const seoTitle = GUIDE_SEO_TITLES[slug];
      expect(seoTitle).toBeDefined();
      expect(`${seoTitle} · bb.haruhime.moe`.length).toBeLessThanOrEqual(60);
      expect(guide?.description.length).toBeGreaterThanOrEqual(140);
      expect(guide?.description.length).toBeLessThanOrEqual(160);
    },
  );

  it("names a search title for exactly the registered guides", () => {
    expect(Object.keys(GUIDE_SEO_TITLES).sort()).toEqual(
      CONTENT.entries.guides.map((e) => e.slug).sort(),
    );
  });

  it("makes a guide a TechArticle with dateModified and breadcrumbs", () => {
    const entry = CONTENT.entries.guides.find((e) => e.slug === "userpage");
    if (!entry) throw new Error("no userpage guide");
    const [article, crumbs] = contentLd("guides", entry)["@graph"];
    expect(article).toMatchObject({
      "@type": "TechArticle",
      headline: "How to make an osu! userpage",
      url: "https://bb.haruhime.moe/guides/userpage",
    });
    expect(article?.dateModified).toMatch(/^2026-09-28/);
    expect(crumbs?.["@type"]).toBe("BreadcrumbList");
    expect(JSON.stringify(crumbs)).toContain("https://bb.haruhime.moe/guides");
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
