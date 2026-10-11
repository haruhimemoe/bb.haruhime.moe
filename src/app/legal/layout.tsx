/**
 * @file src/app/legal/layout.tsx
 * @desc The legal section's frame: its nav (the index, then every registered page) beside
 *       the page on wide screens, above it on phones.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 4, 2026
 * @modified Sun Oct 11, 2026
 */

import { ContentLayout, ContentNav } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CONTENT } from "@/constants/content";
import { toNavItem } from "@/utils/content-nav";

const GROUPS = [{ items: CONTENT.entries.legal.map(toNavItem("legal")) }];

/**
 * @function LegalLayout
 * @param props {{ children: ReactNode }} the page
 * @returns {JSX.Element} the section nav beside the page
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const ui = useTranslations("ui");
  return (
    <ContentLayout
      nav={
        <ContentNav
          label={t("footer.legal")}
          indexHref="/legal"
          groups={GROUPS}
          indexLabel={ui("contentNav.overview")}
          summaryLabel={ui("contentNav.contents")}
        />
      }
    >
      {children}
    </ContentLayout>
  );
}
