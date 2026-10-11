/**
 * @file src/components/layout/Footer.tsx
 * @desc Site footer: the bb / About / Legal link columns with ui's "haruhime tools" column
 *       (packs, pools, All tools) after bb, one line of fine print (we never
 *       host images, the affiliation notice), and the row linking the parent brand, the Discord
 *       server and the haruhimemoe GitHub org.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { SiteFooter } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { footerColumns, SITE } from "@/constants/site";

/**
 * @function Footer
 * @returns {JSX.Element} ui's SiteFooter with the columns, the Discord and GitHub links and the
 *          trademark notice
 */
export function Footer() {
  const t = useTranslations("bb");
  const common = useTranslations("common");
  const ui = useTranslations("ui");
  return (
    <SiteFooter
      columns={footerColumns(t, common)}
      navLabel={ui("shell.footerNav")}
      tools={{ current: "bb", title: ui("shell.tools"), allLabel: ui("shell.allTools") }}
      finePrint={t("footer.finePrint")}
      parentHref={SITE.parentUrl}
      githubHref={SITE.githubOrg}
      discordHref={SITE.discordUrl}
    />
  );
}
