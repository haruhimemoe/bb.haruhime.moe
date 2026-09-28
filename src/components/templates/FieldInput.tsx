/**
 * @file src/components/templates/FieldInput.tsx
 * @desc One template field in the fill-in form, as its kind asks: a text area for multi-line
 *       text and player lists (one name or id per line), number, date and URL inputs, and a
 *       plain text input for the rest (a player, a country code, a color). The label says when
 *       a field is required; its default shows as the placeholder.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Textarea, TextInput } from "@haruhimemoe/ui";
import type { FieldKind } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";

const HINTS: Partial<Record<FieldKind, string>> = {
  user: "An osu! username or user ID.",
  users: "One osu! username or user ID per line.",
  country: "A two-letter country code, like JP.",
  color: "A hex color like #ff66aa, or a color name.",
};

const INPUT_TYPES: Partial<Record<FieldKind, string>> = {
  number: "number",
  date: "date",
  url: "url",
};

type FieldInputProps = {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  /** Prefix for the input's id, unique on the page. */
  idPrefix: string;
};

/**
 * @function FieldInput
 * @param props {FieldInputProps} the field, its value, the change handler and the id prefix
 * @returns {JSX.Element} the right input for the field's kind
 */
export function FieldInput({ field, value, onChange, idPrefix }: FieldInputProps) {
  const id = `${idPrefix}-${field.key}`;
  const label = field.required ? `${field.label} (required)` : field.label;
  const common = {
    id,
    label,
    hint: HINTS[field.kind],
    value,
    placeholder: field.default || undefined,
    required: field.required && field.default === "",
  };
  if (field.kind === "multiline" || field.kind === "users") {
    return <Textarea {...common} rows={4} onChange={(event) => onChange(event.target.value)} />;
  }
  return (
    <TextInput
      {...common}
      type={INPUT_TYPES[field.kind] ?? "text"}
      maxLength={field.kind === "country" ? 2 : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
