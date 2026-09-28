/**
 * @file src/components/me/TemplateDetails.tsx
 * @desc The template form's details: name, description, what it's for and who sees it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Card, Select, TextInput, VisibilitySelect } from "@haruhimemoe/ui";
import {
  DESCRIPTION_MAX,
  KIND_LABELS,
  NAME_MAX,
  NAME_MIN,
  TEMPLATE_KINDS,
  type TemplateKind,
} from "@/constants/templates";
import type { TemplateDraft } from "@/utils/template-draft";

/** Each visibility's line under the select, naming the gallery. */
const VISIBILITY_HINTS = {
  private: { hint: "Only you can see it." },
  unlisted: { hint: "Anyone with the link can see it; it isn't in the gallery." },
  public: { hint: "Anyone can see it, and it's listed in the gallery." },
} as const;

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
  return (
    <Card title="Details">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="template-name"
          label="Name"
          value={draft.name}
          minLength={NAME_MIN}
          maxLength={NAME_MAX}
          required
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <TextInput
          id="template-description"
          label="Description"
          value={draft.description}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <Select
          id="template-kind"
          label="For"
          value={draft.kind}
          onChange={(event) => onChange({ kind: event.target.value as TemplateKind })}
        >
          {TEMPLATE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </Select>
        <VisibilitySelect
          as="select"
          id="template-visibility"
          label="Who sees it"
          text={VISIBILITY_HINTS}
          value={draft.visibility}
          onChange={(visibility) => onChange({ visibility })}
        />
      </div>
    </Card>
  );
}
