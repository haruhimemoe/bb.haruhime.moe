/**
 * @file src/hooks/useProposalMerge.ts
 * @desc The template form's side of merging a proposal (ProposalList): a clean merge replaces the
 *       form with the merged template; a conflict puts the merged draft (the owner's version
 *       where they clash) in the form and remembers which proposal, and which version of it, the
 *       next save resolves (PATCH's `merged`); a stale template reloads. One merge at a time.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { MergeResult, PendingMerge } from "@/components/me/ProposalList";
import type { TemplateView } from "@/schemas/template-view";
import { draftOf, type TemplateDraft } from "@/utils/template-draft";

type Said = { tone: "info" | "error"; text: string };

/** What useProposalMerge hands the form. */
export type ProposalMerge = {
  /** The proposal the next save resolves. */
  merged: PendingMerge | undefined;
  clearMerged: () => void;
  onMerged: (result: MergeResult) => void;
};

/**
 * @function useProposalMerge
 * @param form {object} the form's setters: saved, draft and its message
 * @returns {ProposalMerge} the pending proposal and the merge handler
 */
export function useProposalMerge(form: {
  setSaved: (template: TemplateView) => void;
  setDraft: (change: (current: TemplateDraft) => TemplateDraft) => void;
  say: (said: Said) => void;
}): ProposalMerge {
  const t = useTranslations("bb.proposals");
  const [merged, setMerged] = useState<PendingMerge | undefined>(undefined);
  const replace = (template: TemplateView) => {
    form.setSaved(template);
    form.setDraft(() => draftOf(template));
  };
  const onMerged = (result: MergeResult) => {
    if (result.ok) {
      setMerged(undefined);
      replace(result.template);
      form.say({ tone: "info", text: t("merged", { name: result.name }) });
      return;
    }
    if (result.template) replace(result.template);
    else if (result.draft) form.setDraft((current) => ({ ...current, ...result.draft }));
    if (result.merged) setMerged(result.merged);
    form.say({ tone: "error", text: result.message });
  };
  return { merged, clearMerged: () => setMerged(undefined), onMerged };
}
