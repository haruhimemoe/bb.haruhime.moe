/**
 * @file src/constants/seo.ts
 * @desc The site as @haruhimemoe/next-kit/seo reads it (SEO_SITE: the home keyword, the
 *       description, the link preview image and the haruhime.moe organization), the static
 *       pages' titles and descriptions (the docs, guides and legal indexes among them), and what the home page's
 *       WebApplication lists.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { HARUHIME_ORG, type Site } from "@haruhimemoe/next-kit/seo";
import { SITE } from "@/constants/site";

/** The site for next-kit's metadata, robots, sitemap, JSON-LD and llms.txt helpers. */
export const SEO_SITE: Site = {
  name: SITE.name,
  url: SITE.url,
  title: "osu! BBCode editor and templates",
  titleSuffix: SITE.title,
  // A long template name ends " · bb" instead, so the title stays within 60 characters.
  shortTitleSuffix: "bb",
  description:
    "Write osu! BBCode for your userpage, forum posts and beatmap descriptions with a live preview, then start from a template: built in, your own or shared.",
  ogImages: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "bb: osu! BBCode editor and templates",
      type: "image/png",
    },
  ],
  organization: HARUHIME_ORG,
  parent: { name: "haruhime.moe", url: SITE.parentUrl },
};

/** A static page's title (before " · bb.haruhime.moe") and description. */
export type PageSeo = { path: string; title: string; description: string };

/** The indexable static pages other than the home page. */
export const PAGE_SEO = {
  docs: {
    path: "/docs",
    title: "osu! BBCode reference: every tag with examples",
    description:
      "Every tag osu! supports in userpages, forum posts and beatmap descriptions, each with an example you can edit, plus guides and answers to common questions.",
  },
  templates: {
    path: "/templates",
    title: "osu! userpage and forum post BBCode templates",
    description:
      "osu! BBCode templates for userpages, tournament forum posts and beatmap descriptions. Fill in the fields, open it in the editor, or fork it to make your own.",
  },
  collab: {
    path: "/collab",
    title: "osu! collab maker: imagemap generator",
    description:
      "Paste a collab banner's URL, draw a clickable region over each person and copy the osu! [imagemap] BBCode for your userpage or forum post. Runs in your browser.",
  },
  guides: {
    path: "/guides",
    title: "osu! BBCode guides: userpages, forum posts, collabs",
    description:
      "Step-by-step osu! BBCode guides: a userpage, a tournament forum post, country flags, colors and gradients, collab imagemaps, and the 60,000 character limit.",
  },
  legal: {
    path: "/legal",
    title: "Legal",
    description:
      "The bb.haruhime.moe terms for signing in and sharing templates, and the privacy policy: what bb stores when you sign in or share, why, and how long it keeps it.",
  },
  brand: {
    path: "/brand",
    title: "bb brand assets",
    description:
      "The bb name, logos, icon, colors and type, with the files to download, for tournament staff, wikis and press writing about bb.haruhime.moe and its templates.",
  },
} as const satisfies Record<string, PageSeo>;

/** What the home page's WebApplication says the editor does. */
export const APP_FEATURES: readonly string[] = [
  "Live preview laid out at osu!'s width",
  "Lint that explains what osu! would show as text",
  "Color, gradient and country flag tools",
  "Built-in and shared templates with fields to fill in",
  "Collab imagemap maker",
  "Drafts kept in your browser",
];

/** The collab maker's steps, shown under it and sent as HowTo JSON-LD. */
export const COLLAB_STEPS: readonly { name: string; text: string }[] = [
  {
    name: "Paste the banner's URL",
    text: "Host the banner anywhere that serves images over https and paste its address. It loads straight from that host; bb never keeps it.",
  },
  {
    name: "Draw a region per person",
    text: "Drag over each face or name to draw its area, then give it a link (an osu! profile, any https link, or # for none) and a title. Link players fills them from a list of names.",
  },
  {
    name: "Copy the [imagemap]",
    text: "Copy the BBCode and paste it into your userpage or forum post, or open it in the editor to check the preview first.",
  },
];
