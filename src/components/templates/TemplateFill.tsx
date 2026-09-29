/**
 * @file src/components/templates/TemplateFill.tsx
 * @desc A template's page body: the fields form, the filled preview, "Use" (the filled text goes
 *       to the editor as a new draft through the browser's storage, and the template's uses
 *       counter goes up; a failed count never stops the use), and, for a signed-in visitor,
 *       Fork and Report (not on their own template or a built-in one). A value its field's kind
 *       refuses (a country that isn't a code, a number that isn't one) is named under the form
 *       and stays as `{{key}}` in the preview.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, Card, Notice } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { FieldsForm } from "@/components/templates/FieldsForm";
import { ForkButton } from "@/components/templates/ForkButton";
import { ReportForm } from "@/components/templates/ReportForm";
import { HANDOFF_KEY } from "@/constants/editor";
import type { TemplateView } from "@/schemas/template-view";
import { sendJson } from "@/utils/api-client";
import { previewTargetFor } from "@/utils/preview-scale";
import { writeStored } from "@/utils/storage";
import { fillTemplate } from "@/utils/template-fill";

type TemplateFillProps = {
  template: TemplateView;
  /** The page read the session: Fork and Report need one. */
  signedIn: boolean;
  /** The viewer owns it (no Report). */
  own: boolean;
};

/**
 * @function TemplateFill
 * @param props {TemplateFillProps} the template, and whether the viewer is signed in and owns it
 * @returns {JSX.Element} the form, the preview and the actions
 */
export function TemplateFill({ template, signedIn, own }: TemplateFillProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { text: filled, errors } = fillTemplate(template.body, template.fields, values);
  // Blank required fields are FieldsForm's to say; the rest are values the kind refuses.
  const refused = errors
    .filter((problem) => values[problem.key]?.trim())
    .map((problem) => {
      const label = template.fields.find((field) => field.key === problem.key)?.label;
      return `${label ?? problem.key}: ${problem.message}`;
    });
  const use = () => {
    if (!writeStored(HANDOFF_KEY, filled)) {
      setError("This browser won't let bb save the text for the editor. Copy it from the preview.");
      return;
    }
    // Counting is best effort: the use happens either way.
    void sendJson(`/api/templates/${template.id}/use`, "POST").catch(() => undefined);
    router.push("/");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Fill in">
        <FieldsForm
          fields={template.fields}
          values={values}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        <Notice tone="warning" live as="div" className="mt-3">
          {refused.length > 0 ? refused.map((line) => <p key={line}>{line}</p>) : null}
        </Notice>
      </Card>
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-c1 text-lg">Preview</h2>
        <BbPreview source={filled} target={previewTargetFor(template.kind)} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={use}>Use in the editor</Button>
          {signedIn ? <ForkButton templateId={template.id} /> : null}
        </div>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {signedIn && !own && !template.builtIn ? <ReportForm templateId={template.id} /> : null}
      </div>
    </div>
  );
}
