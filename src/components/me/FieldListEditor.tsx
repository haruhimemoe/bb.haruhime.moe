/**
 * @file src/components/me/FieldListEditor.tsx
 * @desc The template form's fields: every declaration (FieldRow), Add field, and, when the body
 *       uses `{{key}}` placeholders no field declares, a line naming them with a button that
 *       declares them all as text fields.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { Button, Notice, Text } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { FieldRow } from "@/components/me/FieldRow";
import { FIELD_KEY_PATTERN, MAX_FIELDS } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";
import { blankField, nextFieldKey } from "@/utils/template-draft";
import { templateFields } from "@/utils/template-fill";

type FieldListEditorProps = {
  body: string;
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
};

/**
 * @function FieldListEditor
 * @param props {FieldListEditorProps} the body (for its placeholders), the fields and the
 *        change handler
 * @returns {JSX.Element} the field list with its buttons
 */
export function FieldListEditor({ body, fields, onChange }: FieldListEditorProps) {
  const t = useTranslations("bb.field");
  const { undeclared: used } = templateFields(body, fields);
  // The package reads keys with . and - too; bb's fields take only FIELD_KEY_PATTERN.
  const undeclared = used.filter((key) => FIELD_KEY_PATTERN.test(key));
  const unusable = used.filter((key) => !FIELD_KEY_PATTERN.test(key));
  const full = fields.length >= MAX_FIELDS;
  return (
    <div className="flex flex-col gap-3">
      {fields.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <FieldRow
              // Keys change as they're typed; the place is the stable identity while editing.
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place, never reordered.
              key={index}
              index={index}
              field={field}
              onChange={(next) => onChange(fields.map((old, at) => (at === index ? next : old)))}
              onRemove={() => onChange(fields.filter((_, at) => at !== index))}
            />
          ))}
        </ul>
      ) : (
        <Text tone="muted">{t("none")}</Text>
      )}
      {undeclared.length > 0 ? (
        <Notice tone="warning" as="div">
          <p>{t("undeclared", { keys: undeclared.map((key) => `{{${key}}}`).join(", ") })}</p>
          <Button
            variant="secondary"
            className="mt-2"
            disabled={fields.length + undeclared.length > MAX_FIELDS}
            onClick={() => onChange([...fields, ...undeclared.map(blankField)])}
          >
            {t("addThem")}
          </Button>
        </Notice>
      ) : null}
      {unusable.length > 0 ? (
        <Notice tone="warning">
          {t("unusable", { keys: unusable.map((key) => `{{${key}}}`).join(", ") })}
        </Notice>
      ) : null}
      <Button
        variant="secondary"
        disabled={full}
        onClick={() => onChange([...fields, blankField(nextFieldKey(fields))])}
      >
        {t("add")}
      </Button>
    </div>
  );
}
