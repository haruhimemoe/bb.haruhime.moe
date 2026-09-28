/**
 * @file src/constants/site.ts
 * @desc Site identity, the contact email and Discord server, the source repo, the parent brand
 *       and GitHub org, navigation and the footer's columns, the affiliation notice, and
 *       sign-in's marker cookie and landing page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import type { SiteFooterColumn } from "@haruhimemoe/ui";
import { LEGAL_DOCS, LEGAL_SLUGS } from "@/constants/legal";

/** The site's name, URL, description, contact and links. */
export const SITE = {
  name: "bb",
  title: "bb.haruhime.moe",
  url: "https://bb.haruhime.moe",
  description:
    "An osu! BBCode editor with a live preview, and templates for userpages, tournament forum posts and beatmap descriptions: built-in ones, your own, and the ones other players share.",
  contactEmail: "contact@haruhime.moe",
  /** The haruhime.moe Discord server, the footer's Discord icon. */
  discordUrl: "https://discord.gg/bKy9kjMV4y",
  /** Public source repository, linked from the footer. */
  repoUrl: "https://github.com/haruhimemoe/bb.haruhime.moe",
  /** GitHub private vulnerability reporting, the first way to report one (SECURITY.md). */
  advisoriesUrl: "https://github.com/haruhimemoe/bb.haruhime.moe/security/advisories/new",
  /** The parent brand, linked from the footer wordmark. */
  parentUrl: "https://www.haruhime.moe",
  /** The GitHub organization, linked from the footer's GitHub mark. */
  githubOrg: "https://github.com/haruhimemoe",
  trademarkNotice:
    "Not affiliated with or endorsed by ppy Pty Ltd. osu! is a trademark of ppy Pty Ltd.",
} as const;

/** Sent to osu! and pools on every server request: the site and a contact. */
export const SERVER_USER_AGENT = `${SITE.title} (+${SITE.url}; ${SITE.contactEmail})`;

/** Where /signin goes after sign-in when `next` is missing or not a safe path. */
export const DEFAULT_AFTER_SIGN_IN = "/me";

/** The readable "signed in" marker cookie: pages ask for the session only when it's there. */
export const SIGNED_IN_COOKIE = "bb-signed-in";

/** The header's links. */
export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/", label: "Editor" },
  { href: "/templates", label: "Templates" },
  { href: "/collab", label: "Collab" },
  { href: "/docs", label: "Docs" },
];

/** The footer's link columns: bb, About and Legal. */
export const FOOTER_COLUMNS: readonly SiteFooterColumn[] = [
  {
    title: "bb",
    items: [
      { href: "/", label: "Editor" },
      { href: "/templates", label: "Templates" },
      { href: "/collab", label: "Collab maker" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "About",
    items: [
      { href: SITE.repoUrl, label: "Source on GitHub" },
      { href: `mailto:${SITE.contactEmail}`, label: SITE.contactEmail },
    ],
  },
  {
    title: "Legal",
    items: LEGAL_SLUGS.map((slug) => ({ href: `/legal/${slug}`, label: LEGAL_DOCS[slug].title })),
  },
];
