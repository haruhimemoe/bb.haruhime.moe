/**
 * @file src/components/templates/ReportForm.tsx
 * @desc "Report" on a template's page: ui's ReportDisclosure, its reason sent once to
 *       /api/templates/<id>/report. What happened (thanks, already reported, an error) is said
 *       in the page; once sent, the form is gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { ReportDisclosure, type ReportResult } from "@haruhimemoe/ui";
import { REPORT_REASON_MAX } from "@/constants/templates";
import { errorMessageOf, sendJson } from "@/utils/api-client";

const SENT = "Thanks. An admin will look at it.";

/**
 * @function ReportForm
 * @param props {{ templateId: string }} the template to report
 * @returns {JSX.Element} the report disclosure, or what happened
 */
export function ReportForm({ templateId }: { templateId: string }) {
  const send = async (reason: string): Promise<ReportResult> => {
    const response = await sendJson(`/api/templates/${templateId}/report`, "POST", { reason });
    if (response.ok) return { ok: true, message: SENT };
    const message = await errorMessageOf(response, "Reporting failed");
    // Already reported: that's said like a thanks, and the form goes away.
    return response.status === 409 ? { ok: true, message } : { ok: false, message };
  };
  return (
    <ReportDisclosure
      summary="Report this template"
      maxLength={REPORT_REASON_MAX}
      failedMessage="Couldn't reach bb. Try again."
      onSubmit={send}
    />
  );
}
