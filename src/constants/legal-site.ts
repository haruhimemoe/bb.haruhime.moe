/**
 * @file src/constants/legal-site.ts
 * @desc The `LegalSite` config next-kit's legal blocks and `legalEntries` render from: what bb
 *       actually stores (content/legal/privacy.mdx says the same, in prose), who processes data
 *       on bb's behalf (Vercel, MongoDB Atlas, haruhime.moe for sign-in, osu! for lookups), the
 *       cookies bb reads, and the one honest `hosting` line `DmcaNotice` shows: bb stores the templates
 *       members save (their text), never the images, audio or video a preview points at.
 *
 *       Hardcodes the site name and contact email (matching `@/constants/site`'s SITE.title and
 *       SITE.contactEmail) instead of importing them: SITE's own FOOTER_COLUMNS reads
 *       CONTENT.entries.legal, which is built from this file, so importing SITE here would be a
 *       cycle.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Tue Oct 6, 2026
 */

import type { LegalSite } from "@haruhimemoe/next-kit/legal";

/** bb's legal config: feeds `src/mdx-components.tsx`'s bound blocks and `legalEntries`. */
export const LEGAL_SITE: LegalSite = {
  siteName: "bb.haruhime.moe",
  operator: "the operator of bb.haruhime.moe",
  contactEmail: "haruhime@haruhime.moe",
  effectiveDate: "2026-10-06",
  stores: [
    {
      what: "Your API key, if you make one",
      why: "a hash of it, its first characters and when it was made and last used, so the API knows the key is yours (the account itself lives on haruhime.moe)",
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
    { name: "MongoDB Atlas", purpose: "stores the template data listed above." },
    {
      name: "haruhime.moe",
      purpose: "runs sign-in and keeps the account and sessions bb reads to know who you are.",
    },
    {
      name: "osu! (ppy Pty Ltd)",
      purpose:
        "confirms sign-in for haruhime.moe and answers the player and beatmap lookups bb makes.",
    },
  ],
  cookies: [
    "haruhime.moe's session cookie (on .haruhime.moe) keeps you signed in; bb only reads it. It's HttpOnly, so page scripts can't read it.",
    "`haruhime-signed-in`, also set by haruhime.moe, tells the page to check whether you're signed in. Page scripts can read it, and it holds no personal data.",
  ],
  hosting:
    "bb stores the templates members save, including their name, description and BBCode text, but it doesn't host images, audio or video: a preview loads those straight from wherever the template links them.",
};
