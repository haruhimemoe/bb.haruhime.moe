/**
 * @file src/constants/legal-site.ts
 * @desc The `LegalSite` config next-kit's legal blocks and `legalEntries` render from: what bb
 *       actually stores (content/legal/privacy.mdx says the same, in prose), who processes data
 *       on bb's behalf (Vercel, MongoDB Atlas, osu! for sign-in and lookups), the cookies bb
 *       sets, and the one honest `hosting` line `DmcaNotice` shows: bb stores the templates
 *       members save (their text), never the images, audio or video a preview points at.
 *
 *       Hardcodes the site name and contact email (matching `@/constants/site`'s SITE.title and
 *       SITE.contactEmail) instead of importing them: SITE's own FOOTER_COLUMNS reads
 *       CONTENT.entries.legal, which is built from this file, so importing SITE here would be a
 *       cycle.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import type { LegalSite } from "@haruhimemoe/next-kit/legal";

/** bb's legal config: feeds `src/mdx-components.tsx`'s bound blocks and `legalEntries`. */
export const LEGAL_SITE: LegalSite = {
  siteName: "bb.haruhime.moe",
  operator: "the operator of bb.haruhime.moe",
  contactEmail: "contact@haruhime.moe",
  effectiveDate: "2026-10-05",
  stores: [
    {
      what: "Account data, if you sign in",
      why: "your osu! user ID, username, avatar URL and country, and session records, so you can sign in and stay signed in",
    },
    {
      what: "Templates you save",
      why: "name, description, kind, BBCode, fields, visibility and use count, so you and others (if public) can use them",
    },
    {
      what: "Template history",
      why: "every saved version of a template and who saved it, so changes can be reviewed or a fork can pull in updates",
    },
    {
      what: "Reports",
      why: "who reported a template and why, so a report counts once and can be reviewed",
    },
    {
      what: "osu! and pool lookups",
      why: "osu! user and beatmap details, cached briefly (up to a week) so a repeat lookup doesn't ask osu! again",
    },
    {
      what: "Rate-limit counters",
      why: "short-lived, per IP address or account, to stop floods; deleted automatically within about two hours",
    },
  ],
  processors: [
    { name: "Vercel", purpose: "hosts the website and runs its server functions." },
    { name: "MongoDB Atlas", purpose: "stores the account and template data listed above." },
    {
      name: "osu! (ppy Pty Ltd)",
      purpose: "handles sign-in and answers the player and beatmap lookups bb makes.",
    },
  ],
  cookies: [
    "The session cookie keeps you signed in. It's HttpOnly, so page scripts can't read it.",
    "`bb-signed-in` tells the page to check whether you're signed in. Page scripts can read it, and it holds no personal data.",
  ],
  hosting:
    "bb stores the templates members save, including their name, description and BBCode text, but it doesn't host images, audio or video: a preview loads those straight from wherever the template links them.",
};
