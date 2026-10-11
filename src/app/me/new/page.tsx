/**
 * @file src/app/me/new/page.tsx
 * @desc /me/new: make a template. Sign-in otherwise; never indexed. Nothing is made until the
 *       form is sent, so a prefetch or a crawler never makes one.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TemplateForm } from "@/components/me/TemplateForm";
import { requireUser } from "@/lib/auth-session";

/** The page's title; it's never indexed. */
export const metadata: Metadata = { title: "New template", robots: { index: false } };

/**
 * @function NewTemplatePage
 * @returns {Promise<JSX.Element>} the empty template form (a visitor goes to sign in)
 */
export default async function NewTemplatePage() {
  await requireUser("/me/new");
  const t = await getTranslations("bb.me");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newTitle")} lead={t("newLead")} />
      <TemplateForm />
    </div>
  );
}
