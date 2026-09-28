/**
 * @file tests/components/templates/FieldsForm.test.tsx
 * @desc The fill-in form: one input per field of the right type, the default as placeholder,
 *       changes reported by key, and the required fields still missing said in the page.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FieldsForm } from "@/components/templates/FieldsForm";
import type { TemplateField } from "@/schemas/template-field";

const FIELDS: TemplateField[] = [
  { key: "name", label: "Name", kind: "text", required: true, default: "" },
  { key: "team", label: "Team", kind: "users", required: false, default: "" },
  { key: "when", label: "Date", kind: "date", required: false, default: "" },
  { key: "size", label: "Players", kind: "number", required: true, default: "16" },
  { key: "link", label: "Link", kind: "url", required: false, default: "https://osu.ppy.sh" },
  { key: "cc", label: "Country", kind: "country", required: false, default: "" },
];

function Harness({ onChange }: { onChange: (key: string, value: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <FieldsForm
      fields={FIELDS}
      values={values}
      onChange={(key, value) => {
        onChange(key, value);
        setValues((current) => ({ ...current, [key]: value }));
      }}
    />
  );
}

describe("FieldsForm", () => {
  it("renders each kind with the right input", () => {
    render(<Harness onChange={vi.fn()} />);
    expect(screen.getByLabelText("Name (required)")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Team").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Players (required)")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Link")).toHaveAttribute("placeholder", "https://osu.ppy.sh");
    expect(screen.getByLabelText("Country")).toHaveAttribute("maxlength", "2");
  });

  it("reports changes by key and says which required fields are missing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.getByRole("status")).toHaveTextContent("Still to fill in: Name.");
    await user.type(screen.getByLabelText("Name (required)"), "Haru");
    expect(onChange).toHaveBeenLastCalledWith("name", "Haru");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("says when there's nothing to fill in", () => {
    render(<FieldsForm fields={[]} values={{}} onChange={vi.fn()} />);
    expect(screen.getByText("This template has no fields to fill in.")).toBeInTheDocument();
  });
});
