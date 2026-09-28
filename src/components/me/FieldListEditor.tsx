/**
 * @file src/components/me/FieldListEditor.tsx
 * @desc The template form's fields: every declaration (FieldRow), Add field, and, when the body
 *       uses `{{key}}` placeholders no field declares, a line naming them with a button that
 *       declares them all as text fields.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Button, Notice } from "@haruhimemoe/ui";
import { FieldRow } from "@/components/me/FieldRow";
import { MAX_FIELDS } from "@/constants/templates";
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
  const { undeclared } = templateFields(body, fields);
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
        <p className="text-c3 text-sm">
          No fields. Add one, then put its key in the body as {"{{key}}"}.
        </p>
      )}
      {undeclared.length > 0 ? (
        <Notice tone="warning" as="div">
          <p>
            The body uses {undeclared.map((key) => `{{${key}}}`).join(", ")}, which no field
            declares.
          </p>
          <Button
            variant="secondary"
            className="mt-2"
            disabled={fields.length + undeclared.length > MAX_FIELDS}
            onClick={() => onChange([...fields, ...undeclared.map(blankField)])}
          >
            Add them as fields
          </Button>
        </Notice>
      ) : null}
      <Button
        variant="secondary"
        className="self-start"
        disabled={full}
        onClick={() => onChange([...fields, blankField(nextFieldKey(fields))])}
      >
        Add field
      </Button>
    </div>
  );
}
