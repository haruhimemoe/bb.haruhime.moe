/**
 * @file src/components/history/HistoryVisibilityForm.tsx
 * @desc The owner's control for who may see a template's history: only them, or anyone who can
 *       see the template. Saves on change through PUT /api/templates/<id>/history; a failure
 *       rolls the control back and says so.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { Notice, SegmentedControl } from "@haruhimemoe/ui";
import { useState } from "react";
import { HISTORY_COPY } from "@/constants/history";
import { errorMessageOf, sendJson } from "@/utils/api-client";

type HistoryVisibilityFormProps = { templateId: string; historyPublic: boolean };

const OPTIONS = [
  { value: "private", label: "Only me" },
  { value: "public", label: "Anyone who can see the template" },
] as const;

/**
 * @function HistoryVisibilityForm
 * @param props {HistoryVisibilityFormProps} the template and its current history visibility
 * @returns {JSX.Element} the toggle and a live status notice
 */
export function HistoryVisibilityForm({
  templateId,
  historyPublic: initial,
}: HistoryVisibilityFormProps) {
  const [value, setValue] = useState<"private" | "public">(initial ? "public" : "private");
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const onChange = async (next: "private" | "public") => {
    const previous = value;
    setValue(next);
    setMessage(null);
    const response = await sendJson(`/api/templates/${templateId}/history`, "PUT", {
      historyPublic: next === "public",
    });
    if (response.ok) {
      setMessage({ tone: "info", text: "Saved." });
    } else {
      setValue(previous);
      setMessage({ tone: "error", text: await errorMessageOf(response, "Saving failed") });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <SegmentedControl
        label={HISTORY_COPY.publicLabel}
        options={OPTIONS}
        value={value}
        onChange={(next) => void onChange(next)}
      />
      <Notice tone={message?.tone ?? "info"} live>
        {message?.text ?? ""}
      </Notice>
    </div>
  );
}
