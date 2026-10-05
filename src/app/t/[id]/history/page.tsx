/**
 * @file src/app/t/[id]/history/page.tsx
 * @desc /t/<id>/history: a template's versions and one version's changes. Reads the session; a
 *       template the caller can't see 404s, one whose history is private (but the template
 *       itself is visible) shows a plain notice instead of the table. The owner gets the public
 *       toggle; anyone who can revert (the owner) sees Restore on any version but the newest.
 *       Never indexed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { EmptyState, LinkRow, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChangeList } from "@/components/history/ChangeList";
import { HistoryTable } from "@/components/history/HistoryTable";
import { HistoryVisibilityForm } from "@/components/history/HistoryVisibilityForm";
import { RevertButton } from "@/components/history/RevertButton";
import { HISTORY_COPY } from "@/constants/history";
import { TEMPLATE_ID_PATTERN } from "@/constants/templates";
import { getCurrentUser } from "@/lib/auth-session";
import { loadTemplateHistory, loadTemplateRevision } from "@/services/template-history-read";
import { templateChangeLines } from "@/utils/template-changes";

/** The page's title; history is never indexed. */
export const metadata: Metadata = { title: "Template history", robots: { index: false } };

const seqParam = (value: string | string[] | undefined): number | undefined => {
  const text = typeof value === "string" ? value : undefined;
  if (!text || !/^\d+$/.test(text)) return undefined;
  return Number.parseInt(text, 10);
};

/**
 * @function TemplateHistoryPage
 * @param props {PageProps<"/t/[id]/history">} the template id, and `rev` and `before` from the
 *        query
 * @returns {Promise<JSX.Element>} the versions and one version's changes; a private history says
 *          so; a template the caller can't see is a 404
 */
export default async function TemplateHistoryPage({
  params,
  searchParams,
}: PageProps<"/t/[id]/history">) {
  const { id } = await params;
  if (!TEMPLATE_ID_PATTERN.test(id)) notFound();
  const query = await searchParams;
  const caller = await getCurrentUser();
  const history = await loadTemplateHistory(id, caller, seqParam(query.before));
  if (!history.ok) {
    if (history.status !== 403) notFound();
    return (
      <EmptyState title={HISTORY_COPY.privateTitle} variant="filled">
        {HISTORY_COPY.privateBody}
      </EmptyState>
    );
  }
  const { template, access, revisions, older, historyPublic } = history.value;
  const selected = typeof query.rev === "string" ? query.rev : revisions[0]?.id;
  const shown = selected ? await loadTemplateRevision(id, caller, selected) : null;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`History of ${template.name}`} />
      <LinkRow
        items={[
          { href: `/t/${id}`, label: "Back to the template" },
          ...(access.canEdit ? [{ href: `/me/${id}/edit`, label: "Edit" }] : []),
        ]}
      />
      {access.canEdit ? (
        <HistoryVisibilityForm templateId={id} historyPublic={historyPublic} />
      ) : null}
      {shown?.ok ? (
        <ChangeList
          revision={shown.value.revision}
          lines={shown.value.before ? templateChangeLines(shown.value.changes) : null}
          action={
            access.canEdit && shown.value.revision.id !== revisions[0]?.id ? (
              <RevertButton templateId={id} revisionId={shown.value.revision.id} />
            ) : null
          }
        />
      ) : null}
      <HistoryTable templateId={id} revisions={revisions} selected={selected} older={older} />
    </div>
  );
}
