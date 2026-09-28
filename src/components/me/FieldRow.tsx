/**
 * @file src/components/me/FieldRow.tsx
 * @desc One field declaration in the template form: key (what `{{key}}` names), label, kind,
 *       required, default, and Remove.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { Button, Checkbox, Select, TextInput } from "@haruhimemoe/ui";
import { FIELD_KINDS, FIELD_LABEL_MAX, type FieldKind } from "@/constants/templates";
import type { TemplateField } from "@/schemas/template-field";

type FieldRowProps = {
  field: TemplateField;
  /** Its place in the list, for unique ids and labels. */
  index: number;
  onChange: (field: TemplateField) => void;
  onRemove: () => void;
};

/**
 * @function FieldRow
 * @param props {FieldRowProps} the field, its place, and the change and remove handlers
 * @returns {JSX.Element} the field's inputs as a list item
 */
export function FieldRow({ field, index, onChange, onRemove }: FieldRowProps) {
  const id = `tf-${index}`;
  const set = (change: Partial<TemplateField>) => onChange({ ...field, ...change });
  return (
    <li className="grid gap-3 rounded-md bg-b5 p-3 sm:grid-cols-2">
      <TextInput
        id={`${id}-key`}
        label="Key"
        hint={`Use it in the body as {{${field.key || "key"}}}.`}
        value={field.key}
        maxLength={32}
        onChange={(event) => set({ key: event.target.value })}
      />
      <TextInput
        id={`${id}-label`}
        label="Label"
        value={field.label}
        maxLength={FIELD_LABEL_MAX}
        onChange={(event) => set({ label: event.target.value })}
      />
      <Select
        id={`${id}-kind`}
        label="Kind"
        value={field.kind}
        onChange={(event) => set({ kind: event.target.value as FieldKind })}
      >
        {FIELD_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {kind}
          </option>
        ))}
      </Select>
      <TextInput
        id={`${id}-default`}
        label="Default"
        value={field.default}
        onChange={(event) => set({ default: event.target.value })}
      />
      <Checkbox
        id={`${id}-required`}
        label="Required"
        checked={field.required}
        onChange={(event) => set({ required: event.target.checked })}
      />
      <Button variant="ghost" onClick={onRemove} className="justify-self-start">
        Remove field {field.key || index + 1}
      </Button>
    </li>
  );
}
