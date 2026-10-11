/**
 * @file src/app/templates/page.tsx
 * @desc /templates: the public gallery. Search, kind, sort (newest or most used) and page come
 *       from the URL (src/utils/gallery-params.ts); page 1 leads with the matching built-in
 *       templates, then public templates reports haven't hidden, 24 a page. Reads no cookies.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { ld, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ButtonLink, JsonLd, PageHeader, Pagination } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GalleryFilters } from "@/components/templates/GalleryFilters";
import { TemplateList } from "@/components/templates/TemplateList";
import { PAGE_SEO, SEO_SITE } from "@/constants/seo";
import { listGallery } from "@/services/template-gallery";
import { DEFAULT_GALLERY, galleryHref, parseGalleryParams } from "@/utils/gallery-params";

/**
 * @function generateMetadata
 * @param props {PageProps<"/templates">} the gallery's search params
 * @returns {Promise<Metadata>} the gallery's title, description and canonical URL; noindex
 *          unless it's the unfiltered first page
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/templates">): Promise<Metadata> {
  const params = parseGalleryParams(await searchParams);
  return pageMetadata(SEO_SITE, {
    ...PAGE_SEO.templates,
    index: galleryHref(params) === galleryHref(DEFAULT_GALLERY),
  });
}

/**
 * @function TemplatesPage
 * @param props {PageProps<"/templates">} the gallery's search params
 * @returns {Promise<JSX.Element>} the filters, the built-in templates and one page of public
 *          ones, and those templates as an ItemList
 */
export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const t = await getTranslations("bb.templates");
  const ui = uiLabels(await getTranslations("ui"));
  const params = parseGalleryParams(await searchParams);
  const gallery = await listGallery(params);
  const filtered = params.q !== "" || params.kind !== null;
  const listed = [...gallery.builtIns, ...gallery.templates].map((template) => ({
    name: template.name,
    path: `/t/${template.id}`,
  }));
  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        data={ld.graph(
          ld.itemList(SEO_SITE, listed, { name: "osu! BBCode templates" }),
          ld.breadcrumbs(SEO_SITE, [
            { name: "bb", path: "/" },
            { name: "Templates", path: PAGE_SEO.templates.path },
          ]),
        )}
      />
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        actions={<ButtonLink href="/me/new">{t("new")}</ButtonLink>}
      />
      {/* Keyed by the URL, so the search box shows the query after back and forward. */}
      <GalleryFilters key={galleryHref(params)} params={params} />
      {params.page === 1 ? (
        <TemplateList heading={t("builtIn")} templates={gallery.builtIns} empty={t("noBuiltIn")} />
      ) : null}
      <TemplateList
        heading={t("shared")}
        templates={gallery.templates}
        empty={filtered ? t("noShared") : t("noneShared")}
      />
      <Pagination
        page={gallery.page}
        pageCount={gallery.pageCount}
        hrefFor={(page) => galleryHref({ ...params, page })}
        previousLabel={ui.actions.previous}
        nextLabel={ui.actions.next}
        aria-label={ui.actions.pages}
        formatStatus={ui.actions.pageStatus}
      />
    </div>
  );
}
