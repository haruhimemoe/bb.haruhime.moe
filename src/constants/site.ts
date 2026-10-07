/**
 * @file src/constants/site.ts
 * @desc Site identity, the contact email and Discord server, the source repo, the parent brand
 *       and GitHub org, navigation and the footer's columns, the affiliation notice, and
 *       the haruhime.moe hub's account page, the shared signed-in marker and sign-in's landing
 *       page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import { SHARED_MARKER_COOKIE } from "@haruhimemoe/next-kit/auth-react";
import type { SiteFooterColumn } from "@haruhimemoe/ui";
import { CONTENT } from "@/constants/content";

/** The site's name, URL, description, contact and links. */
export const SITE = {
  name: "bb",
  title: "bb.haruhime.moe",
  url: "https://bb.haruhime.moe",
  description:
    "An osu! BBCode editor with a live preview, and templates for userpages, tournament forum posts and beatmap descriptions: built-in ones, your own, and the ones other players share.",
  contactEmail: "haruhime@haruhime.moe",
  /** The haruhime.moe Discord server, the footer's Discord icon. */
  discordUrl: "https://haruhime.moe/discord",
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

/** Where sign-in comes back to when `next` is missing or not a safe path. */
export const DEFAULT_AFTER_SIGN_IN = "/me";

/** The haruhime.moe account page: the osu! account, sessions and deleting the account. Linked
 * only from bb's /account settings page, never the header menu or the command palette. */
export const HUB_ACCOUNT_URL = "https://www.haruhime.moe/account";

/** The hub route that starts osu! sign-in straight away (no hub page), with `?next=`. */
export const HUB_DIRECT_SIGN_IN_PATH = "/api/signin/osu";

/** The readable "signed in" marker the hub sets on .haruhime.moe: pages ask for the session only
 * when it's there. bb only reads it. */
export const SIGNED_IN_COOKIE = SHARED_MARKER_COOKIE;

/** The header's links. */
export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/", label: "Editor" },
  { href: "/templates", label: "Templates" },
  { href: "/collab", label: "Collab" },
  { href: "/docs", label: "Docs" },
];

/** The header account menu's links, above Sign out. */
export const ACCOUNT_MENU_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/me/new", label: "New template" },
  { href: "/me", label: "My templates" },
  { href: "/account", label: "bb settings" },
];

/** The footer's own link columns: bb, About and Legal (ui's SiteFooter adds haruhime tools). */
export const FOOTER_COLUMNS: readonly SiteFooterColumn[] = [
  {
    title: "bb",
    items: [
      { href: "/", label: "Editor" },
      { href: "/templates", label: "Templates" },
      { href: "/collab", label: "Collab maker" },
      { href: "/docs", label: "Docs" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    title: "About",
    items: [
      { href: SITE.repoUrl, label: "Source on GitHub" },
      { href: "/brand", label: "Brand" },
      { href: `mailto:${SITE.contactEmail}`, label: SITE.contactEmail },
    ],
  },
  {
    title: "Legal",
    items: CONTENT.entries.legal.map(({ slug, title }) => ({
      href: `/legal/${slug}`,
      label: title,
    })),
  },
];
