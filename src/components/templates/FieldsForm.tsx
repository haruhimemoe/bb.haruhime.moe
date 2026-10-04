/**
 * @file src/components/templates/FieldsForm.tsx
 * @desc The fill-in form for a template's fields, one input per field in declared order, and
 *       the required fields still blank (with no default), said as the form changes. Controlled:
 *       the values live with the caller, which fills the preview from them.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

import { Notice, Text } from "@haruhimemoe/ui";
import { FieldInput } from "@/components/templates/FieldInput";
import type { TemplateField } from "@/schemas/template-field";
import { type FieldValues, missingRequired } from "@/utils/template-fill";

type FieldsFormProps = {
  fields: readonly TemplateField[];
  values: FieldValues;
  onChange: (key: string, value: string) => void;
};

/**
 * @function FieldsForm
 * @param props {FieldsFormProps} the fields, their values and the change handler
 * @returns {JSX.Element} the inputs and what's still missing, or a line when there are no fields
 */
export function FieldsForm({ fields, values, onChange }: FieldsFormProps) {
  if (fields.length === 0) {
    return <Text tone="muted">This template has no fields to fill in.</Text>;
  }
  const missing = missingRequired(fields, values);
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <FieldInput
          key={field.key}
          idPrefix="field"
          field={field}
          value={values[field.key] ?? ""}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
      <Notice tone="warning" live>
        {missing.length > 0 ? `Still to fill in: ${missing.join(", ")}.` : ""}
      </Notice>
    </div>
  );
}
