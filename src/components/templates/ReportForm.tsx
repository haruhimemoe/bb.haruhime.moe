/**
 * @file src/components/templates/ReportForm.tsx
 * @desc "Report" on a template's page: ui's ReportDisclosure, its reason sent once to
 *       /api/templates/<id>/report. What happened (thanks, already reported, an error) is said
 *       in the page; once sent, the form is gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { uiLabels } from "@haruhimemoe/next-kit/i18n";
import { ReportDisclosure, type ReportResult } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { REPORT_REASON_MAX } from "@/constants/templates";
import { errorMessageOf, sendJson } from "@/utils/api-client";

/**
 * @function ReportForm
 * @param props {{ templateId: string }} the template to report
 * @returns {JSX.Element} the report disclosure, or what happened
 */
export function ReportForm({ templateId }: { templateId: string }) {
  const t = useTranslations("bb.report");
  const ui = uiLabels(useTranslations("ui"));
  const send = async (reason: string): Promise<ReportResult> => {
    const response = await sendJson(`/api/templates/${templateId}/report`, "POST", { reason });
    if (response.ok) return { ok: true, message: t("sent") };
    const message = await errorMessageOf(response, t("failed"));
    // Already reported: that's said like a thanks, and the form goes away.
    return response.status === 409 ? { ok: true, message } : { ok: false, message };
  };
  return (
    <ReportDisclosure
      summary={t("summary")}
      label={ui.forms.reportReason}
      submitLabel={ui.forms.sendReport}
      pendingLabel={ui.forms.sending}
      maxLength={REPORT_REASON_MAX}
      failedMessage={t("offline")}
      onSubmit={send}
    />
  );
}
