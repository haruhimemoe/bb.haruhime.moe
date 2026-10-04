/**
 * @file src/app/admin/page.tsx
 * @desc /admin: templates people reported (hidden ones first), each with its report count, the
 *       latest reasons and Clear reports. A visitor goes to sign in; a signed-in non-admin gets
 *       404. Never indexed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { Badge, Card, PageHeader, Text, TextLink } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { ClearReportsButton } from "@/components/admin/ClearReportsButton";
import { requireAdmin } from "@/lib/auth-session";
import { listReportedTemplates } from "@/services/template-reports";

/** The admin page's title; it's never indexed. */
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/**
 * @function AdminPage
 * @returns {Promise<JSX.Element>} the reported templates
 */
export default async function AdminPage() {
  await requireAdmin("/admin");
  const reported = await listReportedTemplates();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        lead="Templates people reported since an admin last cleared them."
      />
      {reported.length === 0 ? <Text tone="muted">Nothing is reported.</Text> : null}
      {reported.map(({ template, reports, reasons }) => (
        <Card
          key={template.id}
          title={
            <TextLink href={`/t/${template.id}`} variant="plain">
              {template.name}
            </TextLink>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <p className="flex flex-wrap items-center gap-2 text-c3">
              {template.hidden ? <Badge tone="warning">Hidden</Badge> : null}
              <span>
                {reports} report{reports === 1 ? "" : "s"} · by {template.ownerName} ·{" "}
                {template.visibility}
              </span>
            </p>
            <ul className="list-disc pl-5 text-c2">
              {reasons.map((reason, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: reasons are shown once, in order.
                <li key={index}>{reason}</li>
              ))}
            </ul>
            <ClearReportsButton templateId={template.id} />
          </div>
        </Card>
      ))}
    </div>
  );
}
