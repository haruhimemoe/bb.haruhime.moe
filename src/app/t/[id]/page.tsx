/**
 * @file src/app/t/[id]/page.tsx
 * @desc /t/<id>: one template. Built-in templates are for everyone; a person's template shows
 *       to whoever src/utils/template-access.ts lets see it and 404s for anyone else (so a
 *       private one reveals nothing). Reads the session. Only public templates reports haven't
 *       hidden, and built-in ones, are indexed. Its owner gets Edit, and a notice when reports
 *       hid it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Badge, ButtonLink, Notice, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { TemplateFill } from "@/components/templates/TemplateFill";
import { KIND_LABELS, VISIBILITY_LABELS } from "@/constants/templates";
import { getCurrentUser } from "@/lib/auth-session";
import { getTemplateFor } from "@/services/templates-read";
import { usesText } from "@/utils/template-text";

const load = cache(async (id: string) => {
  const viewer = await getCurrentUser();
  return { viewer, template: await getTemplateFor(id, viewer) };
});

/**
 * @function generateMetadata
 * @param props {PageProps<"/t/[id]">} the template id
 * @returns {Promise<Metadata>} its name and description; noindex unless listed
 */
export async function generateMetadata({ params }: PageProps<"/t/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { template } = await load(id);
  if (!template) return { title: "Template not found", robots: { index: false } };
  const listed = template.visibility === "public" && !template.hidden;
  return {
    title: template.name,
    description: template.description || `An osu! BBCode template: ${KIND_LABELS[template.kind]}.`,
    alternates: { canonical: `/t/${template.id}` },
    ...(listed ? {} : { robots: { index: false } }),
  };
}

/**
 * @function TemplatePage
 * @param props {PageProps<"/t/[id]">} the template id
 * @returns {Promise<JSX.Element>} the template's page, or a 404
 */
export default async function TemplatePage({ params }: PageProps<"/t/[id]">) {
  const { id } = await params;
  const { viewer, template } = await load(id);
  if (!template) notFound();
  const own = viewer !== null && viewer.osuId === template.ownerOsuId;
  const by = template.builtIn ? "Built in" : `By ${template.ownerName}`;
  return (
    <div className="flex flex-col gap-6">
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
