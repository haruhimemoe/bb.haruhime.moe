/**
 * @file src/components/me/TemplateForm.tsx
 * @desc Making or editing a template: name, description, kind, who sees it, the BBCode body with
 *       its preview, and the fields. A new template is POSTed and opens its page; an edit sends
 *       only what changed with the version it started from. When someone changed the template
 *       meanwhile (409), the form takes the template the server sent and says the change wasn't
 *       saved. Refusals (the content filter, the cap, the rate limit) are said in the page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, Card, Notice, Textarea } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { FieldListEditor } from "@/components/me/FieldListEditor";
import { TemplateDetails } from "@/components/me/TemplateDetails";
import { BODY_MAX } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { draftOf, EMPTY_DRAFT, patchOf, type TemplateDraft } from "@/utils/template-draft";

// Said when a 409 reloaded the template.
const RELOADED = "Someone changed this template first. It's reloaded; your change wasn't saved.";

/**
 * @function TemplateForm
 * @param props {{ saved?: TemplateView }} the template to edit (none for a new one)
 * @returns {JSX.Element} the form
 */
export function TemplateForm({ saved: initial }: { saved?: TemplateView }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<TemplateDraft>(initial ? draftOf(initial) : EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const set = (change: Partial<TemplateDraft>) =>
    setDraft((current) => ({ ...current, ...change }));
  const submit = async () => {
    setPending(true);
    setMessage(null);
    try {
      const response = saved
        ? await sendJson(`/api/templates/${saved.id}`, "PATCH", patchOf(saved, draft))
        : await sendJson("/api/templates", "POST", draft);
      if (response.ok) {
        const { template } = (await response.json()) as { template: TemplateView };
        if (!saved) router.push(`/t/${template.id}`);
        setSaved(template);
        setDraft(draftOf(template));
        setMessage({ tone: "info", text: "Saved." });
      } else if (response.status === 409) {
        const { template } = (await response.json()) as { template: TemplateView };
        setSaved(template);
        setDraft(draftOf(template));
        setMessage({ tone: "error", text: RELOADED });
      } else {
        setMessage({ tone: "error", text: await errorMessageOf(response, "Saving failed") });
      }
    } catch {
      setMessage({ tone: "error", text: "Couldn't reach bb. Nothing was saved." });
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
      <TemplateDetails draft={draft} onChange={set} />
      <Card title="BBCode">
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            id="template-body"
            label="Body"
            hint="Put a field's value anywhere with {{key}}."
            value={draft.body}
            maxLength={BODY_MAX}
            rows={18}
            spellCheck={false}
            className="font-mono text-sm"
            onChange={(event) => set({ body: event.target.value })}
          />
          <BbPreview source={draft.body} />
        </div>
      </Card>
      <Card title="Fields">
        <FieldListEditor
          body={draft.body}
          fields={draft.fields}
          onChange={(fields) => set({ fields })}
        />
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : saved ? "Save changes" : "Create template"}
        </Button>
        <Notice tone={message?.tone ?? "info"} live>
          {message?.text ?? ""}
        </Notice>
      </div>
    </form>
  );
}
