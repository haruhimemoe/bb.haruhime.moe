/**
 * @file src/app/templates/page.tsx
 * @desc /templates: the public gallery. Search, kind, sort (newest or most used) and page come
 *       from the URL (src/utils/gallery-params.ts); page 1 leads with the matching built-in
 *       templates, then public templates reports haven't hidden, 24 a page. Reads no cookies.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { ld, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { ButtonLink, JsonLd, PageHeader, Pagination } from "@haruhimemoe/ui";
import type { Metadata } from "next";
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
        title="osu! BBCode templates"
        lead="Ready-made osu! userpages, tournament forum posts and beatmap descriptions. Fill in a template's fields and open it in the editor, or fork it to make your own."
        actions={<ButtonLink href="/me/new">New template</ButtonLink>}
      />
      {/* Keyed by the URL, so the search box shows the query after back and forward. */}
      <GalleryFilters key={galleryHref(params)} params={params} />
      {params.page === 1 ? (
        <TemplateList
          heading="Built in"
          templates={gallery.builtIns}
          empty="No built-in template matches."
        />
      ) : null}
      <TemplateList
        heading="Shared by players"
        templates={gallery.templates}
        empty={filtered ? "No shared template matches." : "Nobody has shared a template yet."}
      />
      <Pagination
        page={gallery.page}
        pageCount={gallery.pageCount}
        hrefFor={(page) => galleryHref({ ...params, page })}
      />
    </div>
  );
}
