/**
 * @file src/components/history/HistoryVisibilityForm.tsx
 * @desc The owner's control for who may see a template's history: only them, or anyone who can
 *       see the template. Saves on change through PUT /api/templates/<id>/history; a failure
 *       rolls the control back and says so.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Notice, SegmentedControl } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorMessageOf, sendJson } from "@/utils/api-client";

type HistoryVisibilityFormProps = { templateId: string; historyPublic: boolean };

const OPTIONS = ["private", "public"] as const;

/**
 * @function HistoryVisibilityForm
 * @param props {HistoryVisibilityFormProps} the template and its current history visibility
 * @returns {JSX.Element} the toggle and a live status notice
 */
export function HistoryVisibilityForm({
  templateId,
  historyPublic: initial,
}: HistoryVisibilityFormProps) {
  const t = useTranslations("bb.history");
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
      setMessage({ tone: "info", text: t("saved") });
    } else {
      setValue(previous);
      setMessage({ tone: "error", text: await errorMessageOf(response, t("saveFailed")) });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <SegmentedControl
        label={t("publicLabel")}
        options={OPTIONS.map((option) => ({ value: option, label: t(`visibility.${option}`) }))}
        value={value}
        onChange={(next) => void onChange(next)}
      />
      <Notice tone={message?.tone ?? "info"} live>
        {message?.text ?? ""}
      </Notice>
    </div>
  );
}
