/**
 * @file src/app/t/[id]/page.tsx
 * @desc /t/<id>: one template. Built-in templates are for everyone; a person's template shows
 *       to whoever src/utils/template-access.ts lets see it and 404s for anyone else (so a
 *       private one reveals nothing). Reads the session. Only public templates reports haven't
 *       hidden, and built-in ones, are indexed and carry CreativeWork JSON-LD and their own
 *       link preview card (/t/<id>/og.png). Its owner gets Edit and a History link (always, for
 *       them); anyone else sees History only once the owner makes it public. A notice shows when
 *       reports hid it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { notFoundMetadata, pageMetadata } from "@haruhimemoe/next-kit/seo";
import { Badge, ButtonLink, JsonLd, LinkRow, Notice, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { TemplateFill } from "@/components/templates/TemplateFill";
import { SEO_SITE } from "@/constants/seo";
import { getCurrentUser } from "@/lib/auth-session";
import { getTemplateFor } from "@/services/templates-read";
import { cardImage, templateCard } from "@/utils/og-card";
import {
  isListedTemplate,
  templateLd,
  templateSeoDescription,
  templateSeoTitle,
} from "@/utils/template-seo";

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
    ...(isListedTemplate(template)
      ? { images: [cardImage(`/t/${template.id}`, templateCard(template))] }
      : {}),
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
  const t = await getTranslations("bb");
  const ui = uiLabels(await getTranslations("ui"));
  const own = viewer !== null && viewer.osuId === template.ownerOsuId;
  const by = template.builtIn
    ? t("template.builtIn")
    : t("template.by", { name: template.ownerName ?? "" });
  const data = templateLd(template);
  return (
    <div className="flex flex-col gap-6">
      {data ? <JsonLd data={data} /> : null}
      <PageHeader
        title={template.name}
        lead={template.description || undefined}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{t(`kinds.${template.kind}`)}</Badge>
            {template.builtIn ? null : (
              <Badge tone="muted">{ui.forms.visibilityText[template.visibility].label}</Badge>
            )}
            <span>
              {by} · {t("uses", { count: template.uses })}
            </span>
          </span>
        }
        actions={
          own ? (
            <ButtonLink href={`/me/${template.id}/edit`}>{t("template.edit")}</ButtonLink>
          ) : null
        }
      />
      {template.historyPublic || own ? (
        <LinkRow items={[{ href: `/t/${template.id}/history`, label: t("template.history") }]} />
      ) : null}
      {template.hidden ? <Notice tone="warning">{t("template.hidden")}</Notice> : null}
      <TemplateFill template={template} signedIn={viewer !== null} own={own} />
    </div>
  );
}
