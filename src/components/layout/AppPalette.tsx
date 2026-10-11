/**
 * @file src/components/layout/AppPalette.tsx
 * @desc bb's command palette: ui's CommandPalette mounted once (Ctrl K / Cmd K, page-global),
 *       with siteCommands (go to Editor/Templates/Collab/Docs, open packs/pools, page actions,
 *       sign in/account) plus bb's own extras: every guide and the API doc as "Go to <page>"
 *       rows, the signed-in account shortcuts (New template, My templates) NAV_LINKS and
 *       ACCOUNT_MENU_ITEMS don't put in the header, and Sign out. Sign out is the same as
 *       the header menu's (signOut, src/lib/account.ts): it ends the hub session from bb's
 *       server and reloads the page here.
 *       signedIn comes from the same client-side account store the header's AccountMenu
 *       already reads (document.cookie's marker, no request until it's set), so mounting this
 *       costs no extra request and keeps the layout static. Editor actions like convert/copy
 *       BBCode aren't here: they need the editor page's own state, so they don't make sense run
 *       from elsewhere.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { type Command, CommandPalette, siteCommands } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { CONTENT } from "@/constants/content";
import { navLinks, SITE } from "@/constants/site";
import { signOut, useAccount } from "@/lib/account";

type T = ReturnType<typeof useTranslations>;

/** "Go to <page>" rows for every guide, group "Guides". Guide titles stay English, like guides. */
const guideCommands = (t: T): Command[] =>
  CONTENT.entries.guides.map((guide) => ({
    id: `bb.guide.${guide.slug}`,
    title: t("palette.goTo", { title: guide.navTitle ?? guide.title }),
    subtitle: guide.description,
    group: t("palette.guides"),
    keywords: ["guide"],
    run: (ctx) => ctx.navigate(`/guides/${guide.slug}`),
  }));

/** "Go to <page>" rows for every top-level docs page (not the per-tag extras). */
const docCommands = (t: T): Command[] =>
  CONTENT.entries.docs.map((doc) => ({
    id: `bb.doc.${doc.slug}`,
    title: t("palette.goTo", { title: doc.title }),
    subtitle: doc.description,
    group: t("palette.docs"),
    keywords: ["docs"],
    run: (ctx) => ctx.navigate(`/docs/${doc.slug}`),
  }));

/**
 * @function AppPalette
 * @returns {JSX.Element} ui's CommandPalette, with siteCommands and bb's guide/doc/account extras
 */
export function AppPalette() {
  const t = useTranslations("bb");
  const ui = uiLabels(useTranslations("ui"));
  const account = useAccount();
  const signedIn = account.status === "signed-in";

  const commands: Command[] = [
    ...siteCommands({
      pages: navLinks(t),
      tools: "bb",
      repo: SITE.repoUrl,
      account: { signedIn, signInHref: "/signin", accountHref: "/account" },
      labels: ui.siteCommands,
    }),
    ...guideCommands(t),
    ...docCommands(t),
    {
      id: "bb.account.new-template",
      title: t("palette.newTemplate"),
      group: ui.siteCommands.account,
      when: () => signedIn,
      run: (ctx) => ctx.navigate("/me/new"),
    },
    {
      id: "bb.account.my-templates",
      title: t("palette.myTemplates"),
      group: ui.siteCommands.account,
      when: () => signedIn,
      run: (ctx) => ctx.navigate("/me"),
    },
    {
      id: "bb.account.sign-out",
      title: ui.account.signOut,
      group: ui.siteCommands.account,
      when: () => signedIn,
      run: () => {
        void signOut();
      },
    },
  ];

  return (
    <CommandPalette
      storageKey="bb"
      commands={commands}
      labels={ui.palette}
      placeholder={ui.paletteProps.placeholder}
      label={ui.paletteProps.label}
    />
  );
}
