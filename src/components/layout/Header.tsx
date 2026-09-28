/**
 * @file src/components/layout/Header.tsx
 * @desc Site header: the library SiteHeader with the bb wordmark, the main nav (Editor,
 *       Templates, Docs) and the account menu (client-side, so public pages still read no
 *       cookies).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { SiteHeader } from "@haruhimemoe/ui";
import Link from "next/link";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { NAV_LINKS, SITE } from "@/constants/site";

/**
 * @function Header
 * @returns {JSX.Element} ui's SiteHeader with the wordmark, the nav and the account menu
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
      actions={<AccountMenu />}
    />
  );
}
