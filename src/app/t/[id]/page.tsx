/**
 * @file src/app/t/[id]/page.tsx
 * @desc /t/<id>: one template. Built-in templates are for everyone; a person's template shows
 *       to whoever src/utils/template-access.ts lets see it and 404s for anyone else (so a
 *       private one reveals nothing). Reads the session. Only public templates reports haven't
 *       hidden, and built-in ones, are indexed and carry CreativeWork JSON-LD. Its owner gets
 *       Edit, and a notice when reports hid it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { notFoundMetadata, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { Badge, ButtonLink, JsonLd, Notice, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { TemplateFill } from "@/components/templates/TemplateFill";
import { SEO_SITE } from "@/constants/seo";
import { KIND_LABELS, VISIBILITY_LABELS } from "@/constants/templates";
import { getCurrentUser } from "@/lib/auth-session";
import { getTemplateFor } from "@/services/templates-read";
import {
  isListedTemplate,
  templateLd,
  templateSeoDescription,
  templateSeoTitle,
} from "@/utils/template-seo";
import { usesText } from "@/utils/template-text";

const load = cache(async (id: string) => {
  const viewer = await getCurrentUser();
  return { viewer, template: await getTemplateFor(id, viewer) };
});

/**
 * @function generateMetadata
 * @param props {PageProps<"/t/[id]">} the template id
 * @returns {Promise<Metadata>} its search title, description and canonical URL; noindex
 *          unless listed (built in, or public and not hidden)
 */
export async function generateMetadata({ params }: PageProps<"/t/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { template } = await load(id);
  if (!template) return notFoundMetadata(SEO_SITE, "Template");
  return pageMetadata(SEO_SITE, {
    path: `/t/${template.id}`,
    title: templateSeoTitle(template),
    description: templateSeoDescription(template),
    index: isListedTemplate(template),
    modifiedTime: template.updatedAt ?? undefined,
  });
}

/**
 * @function TemplatePage
 * @param props {PageProps<"/t/[id]">} the template id
 * @returns {Promise<JSX.Element>} the template's page (with JSON-LD when listed), or a 404
 */
export default async function TemplatePage({ params }: PageProps<"/t/[id]">) {
  const { id } = await params;
  const { viewer, template } = await load(id);
  if (!template) notFound();
  const own = viewer !== null && viewer.osuId === template.ownerOsuId;
  const by = template.builtIn ? "Built in" : `By ${template.ownerName}`;
  const data = templateLd(template);
  return (
    <div className="flex flex-col gap-6">
      {data ? <JsonLd data={data} /> : null}
      <PageHeader
        title={template.name}
        lead={template.description || undefined}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{KIND_LABELS[template.kind]}</Badge>
            {template.builtIn ? null : (
              <Badge tone="muted">{VISIBILITY_LABELS[template.visibility]}</Badge>
            )}
            <span>
              {by} · {usesText(template.uses)}
            </span>
          </span>
        }
        actions={own ? <ButtonLink href={`/me/${template.id}/edit`}>Edit</ButtonLink> : null}
      />
      {template.hidden ? (
        <Notice tone="warning">
          Reports hid this template. Only its owner and admins can see it until an admin clears the
          reports.
        </Notice>
      ) : null}
      <TemplateFill template={template} signedIn={viewer !== null} own={own} />
    </div>
  );
}
