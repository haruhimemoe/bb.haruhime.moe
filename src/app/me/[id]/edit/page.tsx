/**
 * @file src/app/me/[id]/edit/page.tsx
 * @desc /me/<id>/edit: the owner edits a template. A visitor goes to sign in; anyone else,
 *       admins included, and a built-in template get 404. A fork also reads where it stands
 *       against its upstream, so the form can offer pulling its changes in. Never indexed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

import { LinkRow, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HistoryVisibilityForm } from "@/components/history/HistoryVisibilityForm";
import { TemplateForm } from "@/components/me/TemplateForm";
import { requireUser } from "@/lib/auth-session";
import { upstreamStateOf } from "@/services/template-upstream";
import { findStoredTemplate } from "@/services/templates-read";
import { toTemplateView } from "@/utils/template-view";

/** The page's title; it's never indexed. */
export const metadata: Metadata = { title: "Edit template", robots: { index: false } };

/**
 * @function EditTemplatePage
 * @param props {PageProps<"/me/[id]/edit">} the template id
 * @returns {Promise<JSX.Element>} the form filled with the template, or a 404
 */
export default async function EditTemplatePage({ params }: PageProps<"/me/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/me/${id}/edit`);
  const stored = await findStoredTemplate(id);
  if (!stored || stored.ownerOsuId !== user.osuId) notFound();
  const upstream = await upstreamStateOf(stored, user);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${stored.name}`} />
      <LinkRow items={[{ href: `/t/${id}/history`, label: "History" }]} />
      <HistoryVisibilityForm templateId={id} historyPublic={stored.historyPublic === true} />
      <TemplateForm saved={toTemplateView(stored)} upstream={upstream} />
    </div>
  );
}
