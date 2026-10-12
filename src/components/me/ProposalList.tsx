/**
 * @file src/components/me/ProposalList.tsx
 * @desc On a template's edit page, for its owner: the open proposals people sent from their
 *       copies, each with who sent it, their note and what it changes (ChangeLines), and Merge
 *       or Decline. A clean merge hands the saved template to the form and leaves the list, as a
 *       declined one does; an overlap hands the merged draft and the proposal to close on the
 *       resolving save, and the card stays, marked, until that save closes it. Merging waits for
 *       unsaved changes and for a pending resolve.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Card, Notice, SectionHeading, Surface, Text } from "@haruhimemoe/ui";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ChangeLines } from "@/components/history/ChangeLines";
import type { ProposalView } from "@/schemas/proposal";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { formatShortDate } from "@/utils/date";
import { templateChangeLines } from "@/utils/template-changes";
import type { TemplateDraft } from "@/utils/template-draft";

/** A proposal a conflicted merge waits on, and the version of it the draft holds. */
export type PendingMerge = { id: string; at: number };

/** What a merge comes to, for the form: merged, a conflict's draft, or a stale template. */
export type MergeResult =
  | { ok: true; template: TemplateView; name: string }
  | {
      ok: false;
      message: string;
      draft?: Partial<TemplateDraft>;
      merged?: PendingMerge;
      template?: TemplateView;
    };

type ProposalListProps = {
  templateId: string;
  proposals: readonly ProposalView[];
  onMerged: (result: MergeResult) => void;
  /** The form has unsaved changes: merging waits for them to be saved or undone. */
  dirty: boolean;
  /** The proposal a conflicted merge is waiting on the next save for. */
  pending: string | undefined;
};

/**
 * @function ProposalList
 * @param props {ProposalListProps} the template, its open proposals and the merge callback
 * @returns {JSX.Element | null} the proposals, or null when there are none and nothing to say
 */
export function ProposalList({
  templateId,
  proposals,
  onMerged,
  dirty,
  pending,
}: ProposalListProps) {
  const t = useTranslations("bb.proposals");
  const locale = useLocale();
  const [open, setOpen] = useState(proposals);
  const [busy, setBusy] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  // A resolving save closed the pending proposal: it leaves the list.
  const resolving = useRef(pending);
  useEffect(() => {
    const was = resolving.current;
    resolving.current = pending;
    if (was && !pending) setOpen((list) => list.filter((one) => one.id !== was));
  }, [pending]);
  const canMerge = !dirty && pending === undefined && busy === null;
  const act = async (proposal: ProposalView, action: "merge" | "decline") => {
    setBusy(proposal.id);
    setSaid("");
    const name = proposal.proposer.username;
    try {
      const at = `/api/templates/${templateId}/proposals/${proposal.id}/${action}`;
      const response = await sendJson(at, "POST");
      if (response.ok) setOpen((list) => list.filter((one) => one.id !== proposal.id));
      if (response.ok && action === "decline") setSaid(t("declined", { name }));
      if (response.ok && action === "merge") {
        const { template } = (await response.json()) as { template: TemplateView };
        onMerged({ ok: true, template, name });
      } else if (response.status === 409) {
        const body = (await response.json()) as {
          template?: TemplateView;
          error: {
            code?: string;
            message: string;
            draft?: Partial<TemplateDraft>;
            merged?: PendingMerge;
          };
        };
        const { code, message, draft, merged } = body.error;
        onMerged(
          code === "proposal_conflict"
            ? { ok: false, message, draft, merged }
            : { ok: false, message, template: body.template },
        );
      } else if (!response.ok) {
        setSaid(await errorMessageOf(response, t("failed", { status: response.status })));
      }
    } catch {
      setSaid(t("offline"));
    }
    setBusy(null);
  };
  if (open.length === 0 && said === "") return null;
  return (
    <Card title={t("title")}>
      <div className="flex flex-col gap-3">
        {open.length > 0 ? <Text tone="muted">{t("lead")}</Text> : null}
        {open.length > 0 && dirty && pending === undefined ? (
          <Notice tone="info">{t("saveFirst")}</Notice>
        ) : null}
        {open.map((proposal) => (
          <Surface key={proposal.id} padding="md" className="flex flex-col gap-3">
            <SectionHeading level={3} detail={formatShortDate(proposal.updatedAt, locale)}>
              {t("by", { name: proposal.proposer.username })}
            </SectionHeading>
            {proposal.message ? (
              <blockquote className="text-c2">{proposal.message}</blockquote>
            ) : null}
            <ChangeLines lines={templateChangeLines(proposal.changes)} />
            {pending === proposal.id ? <Notice tone="info">{t("resolving")}</Notice> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                aria-label={t("mergeLabel", { name: proposal.proposer.username })}
                disabled={!canMerge}
                onClick={() => void act(proposal, "merge")}
              >
                {busy === proposal.id ? t("merging") : t("merge")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label={t("declineLabel", { name: proposal.proposer.username })}
                disabled={busy !== null || pending === proposal.id}
                onClick={() => void act(proposal, "decline")}
              >
                {t("decline")}
              </Button>
            </div>
          </Surface>
        ))}
        <Notice live>{said}</Notice>
      </div>
    </Card>
  );
}
