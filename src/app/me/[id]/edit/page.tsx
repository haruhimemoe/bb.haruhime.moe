/**
 * @file src/app/me/[id]/edit/page.tsx
 * @desc /me/<id>/edit: the owner edits a template. A visitor goes to sign in; anyone else,
 *       admins included, and a built-in template get 404. Never indexed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateForm } from "@/components/me/TemplateForm";
import { requireUser } from "@/lib/auth-session";
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
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${stored.name}`} />
      <TemplateForm saved={toTemplateView(stored)} />
    </div>
  );
}
