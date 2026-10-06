/**
 * @file src/components/layout/Header.tsx
 * @desc Site header: the library SiteHeader with the bb wordmark, the main nav (Editor,
 *       Templates, Docs), the command palette button (opens AppPalette, mounted once in the
 *       root layout) and the account menu (client-side, so public pages still read no cookies).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { CommandPaletteButton, SiteHeader } from "@haruhimemoe/ui";
import Link from "next/link";
import { ACCOUNT_MENU_ITEMS, NAV_LINKS, SITE } from "@/constants/site";
import { AccountMenu } from "@/lib/account";

/**
 * @function Header
 * @returns {JSX.Element} ui's SiteHeader with the wordmark, the nav, the palette button and the
 *          account menu
 */
export function Header() {
  return (
    <SiteHeader
      brand={
        <Link href="/" className="font-extrabold text-c1 text-xl tracking-tight">
          {SITE.name}
          <span aria-hidden="true" className="text-h1">
            .
          </span>
        </Link>
      }
      links={NAV_LINKS}
      actions={
        <>
          <CommandPaletteButton />
          <AccountMenu items={ACCOUNT_MENU_ITEMS} />
        </>
      }
    />
  );
}
