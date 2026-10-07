/**
 * @file src/components/layout/AppPalette.tsx
 * @desc bb's command palette: ui's CommandPalette mounted once (Ctrl K / Cmd K, page-global),
 *       with siteCommands (go to Editor/Templates/Collab/Docs, open packs/pools, page actions,
 *       sign in/account) plus bb's own extras: every guide and the API doc as "Go to <page>"
 *       rows, the signed-in account shortcuts (New template, My templates) NAV_LINKS and
 *       ACCOUNT_MENU_ITEMS don't put in the header, and Sign out. Sessions belong to the
 *       haruhime.moe hub, so Sign out opens the hub's account page (signOutOnHub, the same the
 *       header's menu uses, src/lib/account.ts), where signing out ends it for every tool.
 *       signedIn comes from the same client-side account store the header's AccountMenu
 *       already reads (document.cookie's marker, no request until it's set), so mounting this
 *       costs no extra request and keeps the layout static. Editor actions like convert/copy
 *       BBCode aren't here: they need the editor page's own state, so they don't make sense run
 *       from elsewhere.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Tue Oct 6, 2026
 */

"use client";

import { type Command, CommandPalette, siteCommands } from "@haruhimemoe/ui";
import { CONTENT } from "@/constants/content";
import { NAV_LINKS, SITE } from "@/constants/site";
import { signOutOnHub, useAccount } from "@/lib/account";

/** "Go to <page>" rows for every guide, group "Guides". */
const GUIDE_COMMANDS: Command[] = CONTENT.entries.guides.map((guide) => ({
  id: `bb.guide.${guide.slug}`,
  title: `Go to ${guide.navTitle ?? guide.title}`,
  subtitle: guide.description,
  group: "Guides",
  keywords: ["guide"],
  run: (ctx) => ctx.navigate(`/guides/${guide.slug}`),
}));

/** "Go to <page>" rows for every top-level docs page (not the per-tag extras). */
const DOC_COMMANDS: Command[] = CONTENT.entries.docs.map((doc) => ({
  id: `bb.doc.${doc.slug}`,
  title: `Go to ${doc.title}`,
  subtitle: doc.description,
  group: "Docs",
  keywords: ["docs"],
  run: (ctx) => ctx.navigate(`/docs/${doc.slug}`),
}));

/**
 * @function AppPalette
 * @returns {JSX.Element} ui's CommandPalette, with siteCommands and bb's guide/doc/account extras
 */
export function AppPalette() {
  const account = useAccount();
  const signedIn = account.status === "signed-in";

  const commands: Command[] = [
    ...siteCommands({
      pages: NAV_LINKS,
      tools: "bb",
      repo: SITE.repoUrl,
      account: { signedIn, signInHref: "/signin", accountHref: "/account" },
    }),
    ...GUIDE_COMMANDS,
    ...DOC_COMMANDS,
    {
      id: "bb.account.new-template",
      title: "New template",
      group: "Account",
      when: () => signedIn,
      run: (ctx) => ctx.navigate("/me/new"),
    },
    {
      id: "bb.account.my-templates",
      title: "My templates",
      group: "Account",
      when: () => signedIn,
      run: (ctx) => ctx.navigate("/me"),
    },
    {
      id: "bb.account.sign-out",
      title: "Sign out",
      group: "Account",
      when: () => signedIn,
      run: () => {
        void signOutOnHub();
      },
    },
  ];

  return <CommandPalette storageKey="bb" commands={commands} />;
}
