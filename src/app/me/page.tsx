/**
 * @file src/app/me/page.tsx
 * @desc /me: your templates, last changed first, each with who sees it, Edit and Delete, and
 *       New template. Sign-in otherwise; never indexed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { ButtonLink, PageHeader, Text } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { MyTemplateRow } from "@/components/me/MyTemplateRow";
import { MAX_TEMPLATES_PER_USER } from "@/constants/templates";
import { RestoreSignedIn } from "@/lib/account";
import { requireUser } from "@/lib/auth-session";
import { listMyTemplates } from "@/services/templates-read";

/** The page's title; it's never indexed. */
export const metadata: Metadata = { title: "My templates", robots: { index: false } };

/**
 * @function MyTemplatesPage
 * @returns {Promise<JSX.Element>} the signed-in user's templates (a visitor goes to sign in)
 */
export default async function MyTemplatesPage() {
  const user = await requireUser("/me");
  const templates = await listMyTemplates(user.osuId);
  return (
    <div className="flex flex-col gap-6">
      <RestoreSignedIn />
      <PageHeader
        title="My templates"
        meta={`${templates.length} of ${MAX_TEMPLATES_PER_USER}`}
        actions={<ButtonLink href="/me/new">New template</ButtonLink>}
      />
      {templates.length === 0 ? (
        <Text tone="muted">You have no templates yet. Make one, or fork one from the gallery.</Text>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => (
            <MyTemplateRow key={template.id} template={template} />
          ))}
        </ul>
      )}
    </div>
  );
}
