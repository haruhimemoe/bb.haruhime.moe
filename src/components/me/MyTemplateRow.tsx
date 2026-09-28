/**
 * @file src/components/me/MyTemplateRow.tsx
 * @desc One of your templates on /me: its name (its page), kind, uses and last change, who sees
 *       it (changed in place with the version it started from; a 409 takes the server's
 *       template), Edit, and Delete (confirmed in the page with ui's InlineConfirm). A deleted
 *       row says so and stays gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Badge, ButtonLink, InlineConfirm, Notice, Select } from "@haruhimemoe/ui";
import Link from "next/link";
import { useState } from "react";
import {
  KIND_LABELS,
  VISIBILITIES,
  VISIBILITY_LABELS,
  type Visibility,
} from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { usesText } from "@/utils/template-text";

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
      <li className="rounded-lg bg-b4 p-4 text-c3 text-sm" role="status">
        Deleted {template.name}.
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-3 rounded-lg bg-b4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/t/${template.id}`}
          className="font-bold text-c1 underline-offset-2 hover:underline"
        >
          {template.name}
        </Link>
        <Badge tone="accent">{KIND_LABELS[template.kind]}</Badge>
        {template.hidden ? <Badge tone="warning">Hidden by reports</Badge> : null}
        <span className="text-c4 text-xs">{usesText(template.uses)}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Select
          id={`visibility-${template.id}`}
          label="Who sees it"
          value={template.visibility}
          onChange={(event) => void setVisibility(event.target.value as Visibility)}
        >
          {VISIBILITIES.map((visibility) => (
            <option key={visibility} value={visibility}>
              {VISIBILITY_LABELS[visibility]}
            </option>
          ))}
        </Select>
        <ButtonLink href={`/me/${template.id}/edit`} variant="secondary">
          Edit
        </ButtonLink>
        <InlineConfirm
          trigger="Delete"
          question={`Delete ${template.name}? This can't be undone.`}
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          onConfirm={remove}
        />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </li>
  );
}
