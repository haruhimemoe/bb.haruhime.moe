/**
 * @file src/app/collab/page.tsx
 * @desc /collab: the imagemap maker for collabs and link maps, then how to use it in three
 *       steps, with WebApplication, HowTo and breadcrumb JSON-LD. Static; everything runs in the
 *       browser, and the image loads from its own host.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { ld, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { JsonLd, PageHeader } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { CollabMaker } from "@/components/collab/CollabMaker";
import { CollabSteps } from "@/components/collab/CollabSteps";
import { COLLAB_STEPS, PAGE_SEO, SEO_SITE } from "@/constants/seo";

/** The page's title, description and canonical URL. */
export const metadata = pageMetadata(SEO_SITE, PAGE_SEO.collab);

const COLLAB_LD = ld.graph(
  ld.webApplication(SEO_SITE, {
    path: PAGE_SEO.collab.path,
    name: "bb collab maker",
    description: PAGE_SEO.collab.description,
    category: "UtilitiesApplication",
  }),
  ld.howTo({
    name: "How to make an osu! collab imagemap",
    description: PAGE_SEO.collab.description,
    steps: COLLAB_STEPS,
  }),
  ld.breadcrumbs(SEO_SITE, [
    { name: "bb", path: "/" },
    { name: "Collab maker", path: PAGE_SEO.collab.path },
  ]),
);

/**
 * @function CollabPage
 * @returns {JSX.Element} the page title, the collab maker and the steps
 */
export default function CollabPage() {
  const t = useTranslations("bb.collab");
  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={COLLAB_LD} />
      <PageHeader title={t("title")} lead={t("lead")} />
      <CollabMaker />
      <CollabSteps />
    </div>
  );
}
