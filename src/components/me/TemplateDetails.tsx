/**
 * @file src/components/me/TemplateDetails.tsx
 * @desc The template form's details: name, description, what it's for and who sees it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { Card, Select, TextInput, VisibilitySelect } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  NAME_MIN,
  TEMPLATE_KINDS,
  type TemplateKind,
} from "@/constants/templates";
import type { TemplateDraft } from "@/utils/template-draft";

type TemplateDetailsProps = {
  draft: TemplateDraft;
  onChange: (change: Partial<TemplateDraft>) => void;
};

/**
 * @function TemplateDetails
 * @param props {TemplateDetailsProps} the form's values and the change handler
 * @returns {JSX.Element} the details card
 */
export function TemplateDetails({ draft, onChange }: TemplateDetailsProps) {
  const t = useTranslations("bb");
  const ui = uiLabels(useTranslations("ui"));
  const text = {
    private: { label: ui.forms.visibilityText.private.label, hint: t("form.hints.private") },
    unlisted: { label: ui.forms.visibilityText.unlisted.label, hint: t("form.hints.unlisted") },
    public: { label: ui.forms.visibilityText.public.label, hint: t("form.hints.public") },
  };
  return (
    <Card title={t("form.details")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="template-name"
          label={t("form.name")}
          value={draft.name}
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          required
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <TextInput
          id="template-description"
          label={t("form.description")}
          value={draft.description}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <Select
          id="template-kind"
          label={t("form.for")}
          value={draft.kind}
          onChange={(event) => onChange({ kind: event.target.value as TemplateKind })}
        >
          {TEMPLATE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </option>
          ))}
        </Select>
        <VisibilitySelect
          as="select"
          id="template-visibility"
          label={t("form.visibility")}
          text={text}
          value={draft.visibility}
          onChange={(visibility) => onChange({ visibility })}
        />
      </div>
    </Card>
  );
}
