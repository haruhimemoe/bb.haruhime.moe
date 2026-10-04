/**
 * @file src/constants/docs-faq.ts
 * @desc The docs' front page copy: the intro that says what osu! BBCode is, and the FAQ shown
 *       under it (also sent as FAQPage JSON-LD, so the questions must stay visible). Answers
 *       come from the guides; keep them in step.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

/** The first paragraph on /docs: what osu! BBCode is and what the docs hold. */
export const DOCS_INTRO =
  "osu! BBCode is the markup osu! uses for userpages (the me! section), forum posts and beatmap descriptions. It uses square-bracket tags like [b], [centre] and [imagemap]. This reference lists every tag osu! supports with an example you can edit, and the guides walk through a userpage, a tournament forum post, flags, colors and collab imagemaps.";

/** One question on /docs, its plain-text answer and where to read more. */
export type DocsFaqItem = {
  question: string;
  answer: string;
  more?: { href: string; label: string };
};

/** The docs' questions, in the order shown. */
export const DOCS_FAQ: readonly DocsFaqItem[] = [
  {
    question: "What is osu! BBCode?",
    answer:
      "Plain text with tags in square brackets that osu! turns into formatting. A tag opens with [name] and closes with [/name], and some take a value after =, like [color=#ff66aa]. osu! reads only its own tags, in lowercase.",
    more: { href: "/guides/getting-started", label: "Getting started" },
  },
  {
    question: "How long can an osu! userpage be?",
    answer:
      "60,000 characters, tags included. Userpages and beatmap descriptions are stored as forum posts, so all three share that limit. bb's counter counts the same way, and an emoji counts as one.",
    more: { href: "/guides/limits-and-gotchas", label: "Limits and gotchas" },
  },
  {
    question: "Why does my tag show up as plain text?",
    answer:
      "osu! didn't read it. The usual causes are a misspelled tag ([center] instead of [centre]), uppercase, a missing closing tag, the same tag inside itself, tags closed in the wrong order, or a one-line tag like [heading] split over lines. bb's editor underlines each one.",
    more: { href: "/guides/limits-and-gotchas", label: "Limits and gotchas" },
  },
  {
    question: "How do I add a country flag?",
    answer:
      "osu! has no flag tag. A flag is an [img] of osu!'s own flag image, like https://assets.ppy.sh/old-flags/JP.png for Japan. In bb, press Flag in the toolbar and pick a country; it writes the [img] for you.",
    more: { href: "/guides/flags", label: "Flags" },
  },
  {
    question: "How do I make a clickable collab banner?",
    answer:
      "Use an [imagemap]: the image's address, then one line per clickable area with its position and size in percent, a link and a title. The collab maker draws the areas on your banner and writes the lines for you.",
    more: { href: "/collab", label: "Collab maker" },
  },
  {
    question: "Can I use gradient text, and what does it cost?",
    answer:
      "Yes, but osu! has no gradient tag, so each letter gets its own [color] tag, about 24 characters a letter. A short name is fine; a paragraph eats the limit. The editor's gradient tool shows what the colors add.",
    more: { href: "/guides/colors-and-gradients", label: "Colors and gradients" },
  },
  {
    question: "Does bb save my drafts?",
    answer:
      "Yes, in this browser only. Drafts stay in your browser's storage and are never sent to bb, so they won't follow you to another device. Copy the BBCode into osu! when you're done.",
  },
  {
    question: "Can I share a template?",
    answer:
      "Yes. Sign in with osu!, make a template with fields for the parts people fill in, and set it to public to list it in the gallery, or unlisted to share it by link only. Anyone signed in can fork a shared template into their own.",
    more: { href: "/templates", label: "Templates" },
  },
];
