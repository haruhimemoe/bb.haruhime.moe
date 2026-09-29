/**
 * @file src/app/page.tsx
 * @desc The editor: an osu! BBCode source and its preview, drafts kept in this browser.
 *       Static; the editor itself loads in the browser. Carries the site's JSON-LD: the
 *       haruhime.moe Organization, the WebSite with template search, and the WebApplication.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { HARUHIME_ORG, homeMetadata, ld } from "@haruhimemoe/next-kit/seo";
import { JsonLd, PageHeader } from "@haruhimemoe/ui";
import { Editor } from "@/components/editor/Editor";
import { APP_FEATURES, SEO_SITE } from "@/constants/seo";

/** "osu! BBCode editor and templates · bb.haruhime.moe", its description and canonical URL. */
export const metadata = homeMetadata(SEO_SITE);

const HOME_LD = ld.graph(
  ld.organization(HARUHIME_ORG),
  ld.webSite(SEO_SITE, { searchUrlTemplate: "/templates?q={search_term_string}" }),
  ld.webApplication(SEO_SITE, {
    name: "bb: osu! BBCode editor",
    category: "UtilitiesApplication",
    features: APP_FEATURES,
  }),
);

/**
 * @function EditorPage
 * @returns {JSX.Element} the site's JSON-LD, the page title and the editor
 */
export default function EditorPage() {
  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={HOME_LD} />
      <PageHeader
        title="osu! BBCode editor"
        lead="Write a userpage, forum post or beatmap description and see it as you type. Your drafts stay in this browser; nothing is sent anywhere."
      />
      <Editor />
    </div>
  );
}
