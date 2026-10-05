/**
 * @file src/components/me/MyTemplateRow.tsx
 * @desc One of your templates on /me: its name (its page), kind, uses and last change, who sees
 *       it (changed in place with the version it started from; a 409 takes the server's
 *       template), Edit, and Delete (confirmed in the page with ui's InlineConfirm). A deleted
 *       row says so and stays gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import {
  Badge,
  ButtonLink,
  InlineConfirm,
  Notice,
  Surface,
  TextLink,
  textClasses,
  VisibilitySelect,
} from "@haruhimemoe/ui";
import { useState } from "react";
import { KIND_LABELS, type Visibility } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { usesText } from "@/utils/template-text";

/** The row's select shows no line under it, so it lines up with the buttons. */
const NO_HINTS = {
  private: { hint: undefined },
  unlisted: { hint: undefined },
  public: { hint: undefined },
} as const;

/**
 * @function MyTemplateRow
 * @param props {{ template: TemplateView }} the template as the page loaded it
 * @returns {JSX.Element} the row, as a list item
 */
export function MyTemplateRow({ template: initial }: { template: TemplateView }) {
  const [template, setTemplate] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const setVisibility = async (visibility: Visibility) => {
    setError(null);
    try {
      const response = await sendJson(`/api/templates/${template.id}`, "PATCH", {
        baseVersion: template.version,
        visibility,
      });
      if (response.ok || response.status === 409) {
        setTemplate(((await response.json()) as { template: TemplateView }).template);
        if (!response.ok) setError("It changed elsewhere; this is how it is now.");
      } else setError(await errorMessageOf(response, "Saving failed"));
    } catch {
      setError("Couldn't reach bb. Nothing changed.");
    }
  };
  const remove = async () => {
    const response = await sendJson(`/api/templates/${template.id}`, "DELETE");
    if (response.ok) setDeleted(true);
    else setError(await errorMessageOf(response, "Deleting failed"));
  };
  if (deleted) {
    return (
      <Surface as="li" padding="md" className={textClasses({ tone: "muted" })} role="status">
        Deleted {template.name}.
      </Surface>
    );
  }
  return (
    <Surface as="li" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TextLink href={`/t/${template.id}`} variant="plain">
          {template.name}
        </TextLink>
        <Badge tone="accent">{KIND_LABELS[template.kind]}</Badge>
        {template.hidden ? <Badge tone="warning">Hidden by reports</Badge> : null}
        <span className="text-c4 text-xs">{usesText(template.uses)}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <VisibilitySelect
          as="select"
          id={`visibility-${template.id}`}
          label="Who sees it"
          text={NO_HINTS}
          value={template.visibility}
          onChange={(visibility) => void setVisibility(visibility)}
        />
        <ButtonLink href={`/me/${template.id}/edit`} variant="secondary">
          Edit
        </ButtonLink>
        <InlineConfirm
          trigger="Delete"
          question={`Delete ${template.name}? This can't be undone.`}
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          confirmVariant="danger"
          onConfirm={remove}
        />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Surface>
  );
}
