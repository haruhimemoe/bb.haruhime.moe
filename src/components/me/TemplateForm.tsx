/**
 * @file src/components/me/TemplateForm.tsx
 * @desc Making or editing a template: name, description, kind, who sees it, the BBCode body with
 *       its preview, and the fields. A new template is POSTed and opens its page; an edit sends
 *       only what changed with the revision it started from. A content change that merged onto
 *       someone else's keeps saving (merged content lands in the template, not a conflict); a
 *       same-line conflict (409 `merge_conflict`) puts the merged draft back in the form with
 *       this tab's lines kept, so it can be checked and saved again. Any other 409 reloads. For a
 *       fork, `upstream` offers pulling in the source's changes (UpstreamNotice); a clean pull
 *       replaces the draft, a conflicted one puts the merge in the form and carries the pulled
 *       revision on the next save. Proposals both ways are TemplateProposals; a conflicted merge
 *       carries the proposal on the next save so it closes. Refusals are said in the page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Card, Notice, Textarea } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { FieldListEditor } from "@/components/me/FieldListEditor";
import { TemplateDetails } from "@/components/me/TemplateDetails";
import { TemplateProposals } from "@/components/me/TemplateProposals";
import { UpstreamNotice } from "@/components/me/UpstreamNotice";
import { BODY_MAX } from "@/constants/templates";
import { useProposalMerge } from "@/hooks/useProposalMerge";
import type { ProposalView } from "@/schemas/proposal";
import type { TemplateView } from "@/schemas/template-view";
import type { UpstreamState } from "@/services/template-upstream";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { previewTargetFor } from "@/utils/preview-scale";
import { draftOf, EMPTY_DRAFT, patchOf, type TemplateDraft } from "@/utils/template-draft";

/** A merge conflict's shape in a 409's `error`. */
type MergeConflictError = {
  code: "merge_conflict";
  message: string;
  draft: Partial<TemplateDraft>;
};

const isMergeConflict = (error: { code?: string }): error is MergeConflictError =>
  error.code === "merge_conflict";

/**
 * @function TemplateForm
 * @param props {object} the template to edit (none for a new one), for a fork where it stands
 *        against what it copied and its open proposal, and the open proposals sent to it
 * @returns {JSX.Element} the form
 */
export function TemplateForm({
  saved: initial,
  upstream,
  proposals = [],
  proposed = null,
}: {
  saved?: TemplateView;
  upstream?: UpstreamState;
  proposals?: readonly ProposalView[];
  proposed?: string | null;
}) {
  const t = useTranslations("bb.form");
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<TemplateDraft>(initial ? draftOf(initial) : EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  // An upstream revision a pull merged in, carried on the next save (PATCH's `pulled`).
  const [pulled, setPulled] = useState<string | undefined>(undefined);
  const { merged, clearMerged, onMerged } = useProposalMerge({
    setSaved,
    setDraft,
    say: setMessage,
  });
  const dirty = saved !== undefined && JSON.stringify(draftOf(saved)) !== JSON.stringify(draft);
  const set = (change: Partial<TemplateDraft>) =>
    setDraft((current) => ({ ...current, ...change }));
  const submit = async () => {
    setPending(true);
    setMessage(null);
    try {
      const response = saved
        ? await sendJson(`/api/templates/${saved.id}`, "PATCH", {
            ...patchOf(saved, draft),
            ...(pulled ? { pulled } : {}),
            ...(merged ? { merged } : {}),
          })
        : await sendJson("/api/templates", "POST", draft);
      if (response.ok) {
        const { template } = (await response.json()) as { template: TemplateView };
        if (!saved) router.push(`/t/${template.id}`);
        setSaved(template);
        setDraft(draftOf(template));
        setPulled(undefined);
        clearMerged();
        setMessage({ tone: "info", text: t("saved") });
      } else if (response.status === 409) {
        const body = (await response.json()) as {
          template: TemplateView;
          error: { code?: string; message?: string };
        };
        setSaved(body.template);
        if (isMergeConflict(body.error)) {
          setDraft({ ...draftOf(body.template), ...body.error.draft });
          setMessage({ tone: "error", text: body.error.message });
        } else {
          setDraft(draftOf(body.template));
          setMessage({ tone: "error", text: t("reloaded") });
        }
      } else {
        setMessage({ tone: "error", text: await errorMessageOf(response, t("saveFailed")) });
      }
    } catch {
      setMessage({ tone: "error", text: t("offline") });
    }
    setPending(false);
  };
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {saved && upstream ? (
        <UpstreamNotice
          templateId={saved.id}
          state={upstream}
          onPulled={(result) => {
            if (result.ok) {
              setSaved(result.template);
              setDraft(draftOf(result.template));
              setPulled(undefined);
              clearMerged();
              setMessage({ tone: "info", text: t("pulled") });
            } else {
              if (result.draft) setDraft((current) => ({ ...current, ...result.draft }));
              setPulled(result.pulled);
              setMessage({ tone: "error", text: result.message });
            }
          }}
        />
      ) : null}
      {saved ? (
        <TemplateProposals
          templateId={saved.id}
          upstream={upstream}
          proposals={proposals}
          proposed={proposed}
          onMerged={onMerged}
          dirty={dirty}
          pending={merged?.id}
        />
      ) : null}
      <TemplateDetails draft={draft} onChange={set} />
      <Card title={t("bbcode")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            id="template-body"
            label={t("body")}
            hint={t("bodyHint")}
            value={draft.body}
            maxLength={BODY_MAX}
            rows={18}
            spellCheck={false}
            className="font-mono text-sm"
            onChange={(event) => set({ body: event.target.value })}
          />
          <BbPreview source={draft.body} target={previewTargetFor(draft.kind)} />
        </div>
      </Card>
      <Card title={t("fields")}>
        <FieldListEditor
          body={draft.body}
          fields={draft.fields}
          onChange={(fields) => set({ fields })}
        />
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : saved ? t("save") : t("create")}
        </Button>
        <Notice tone={message?.tone ?? "info"} live>
          {message?.text ?? ""}
        </Notice>
      </div>
    </form>
  );
}
