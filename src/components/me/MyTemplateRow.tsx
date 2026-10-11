/**
 * @file src/components/me/MyTemplateRow.tsx
 * @desc One of your templates on /me: its name (its page), kind, uses and last change, who sees
 *       it (changed in place with the version it started from; a 409 takes the server's
 *       template), Edit, and Delete (confirmed in the page with ui's InlineConfirm). A deleted
 *       row says so and stays gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
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
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Visibility } from "@/constants/templates";
import type { TemplateView } from "@/schemas/template-view";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/** The row's select shows no line under it, so it lines up with the buttons. */
const NO_HINTS = {
  private: { hint: undefined },
  unlisted: { hint: undefined },
  public: { hint: undefined },
};

/**
 * @function MyTemplateRow
 * @param props {{ template: TemplateView }} the template as the page loaded it
 * @returns {JSX.Element} the row, as a list item
 */
export function MyTemplateRow({ template: initial }: { template: TemplateView }) {
  const t = useTranslations("bb");
  const ui = uiLabels(useTranslations("ui"));
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
        if (!response.ok) setError(t("row.changed"));
      } else setError(await errorMessageOf(response, t("form.saveFailed")));
    } catch {
      setError(t("row.offline"));
    }
  };
  const remove = async () => {
    const response = await sendJson(`/api/templates/${template.id}`, "DELETE");
    if (response.ok) setDeleted(true);
    else setError(await errorMessageOf(response, t("row.deleteFailed")));
  };
  if (deleted) {
    return (
      <Surface as="li" padding="md" className={textClasses({ tone: "muted" })} role="status">
        {t("row.deleted", { name: template.name })}
      </Surface>
    );
  }
  return (
    <Surface as="li" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TextLink href={`/t/${template.id}`} variant="plain">
          {template.name}
        </TextLink>
        <Badge tone="accent">{t(`kinds.${template.kind}`)}</Badge>
        {template.hidden ? <Badge tone="warning">{t("row.hidden")}</Badge> : null}
        <span className="text-c4 text-xs">{t("uses", { count: template.uses })}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <VisibilitySelect
          as="select"
          id={`visibility-${template.id}`}
          label={t("form.visibility")}
          text={{
            private: { ...NO_HINTS.private, label: ui.forms.visibilityText.private.label },
            unlisted: { ...NO_HINTS.unlisted, label: ui.forms.visibilityText.unlisted.label },
            public: { ...NO_HINTS.public, label: ui.forms.visibilityText.public.label },
          }}
          value={template.visibility}
          onChange={(visibility) => void setVisibility(visibility)}
        />
        <ButtonLink href={`/me/${template.id}/edit`} variant="secondary">
          {t("row.edit")}
        </ButtonLink>
        <InlineConfirm
          trigger={t("row.delete")}
          question={t("row.deleteQuestion", { name: template.name })}
          confirmLabel={t("row.delete")}
          pendingLabel={t("row.deleting")}
          cancelLabel={ui.actions.cancel}
          confirmVariant="danger"
          onConfirm={remove}
        />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Surface>
  );
}
