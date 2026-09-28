/**
 * @file src/components/layout/Footer.tsx
 * @desc Site footer: the bb / About / Legal link columns, one line of fine print (we never
 *       host images, the affiliation notice), and the row linking the parent brand, the Discord
 *       server and the haruhimemoe GitHub org.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { SiteFooter } from "@haruhimemoe/ui";
import { FOOTER_COLUMNS, SITE } from "@/constants/site";

/**
 * @function Footer
 * @returns {JSX.Element} ui's SiteFooter with the columns, the Discord and GitHub links and the
 *          trademark notice
 */
export function Footer() {
  return (
    <SiteFooter
      columns={FOOTER_COLUMNS}
      finePrint={
        <>
          bb never hosts images: pictures in a preview load straight from where they're hosted.{" "}
          {SITE.trademarkNotice}
        </>
      }
      parentHref={SITE.parentUrl}
      githubHref={SITE.githubOrg}
      discordHref={SITE.discordUrl}
    />
  );
}
