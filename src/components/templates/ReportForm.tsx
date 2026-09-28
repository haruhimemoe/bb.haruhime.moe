/**
 * @file src/components/templates/ReportForm.tsx
 * @desc "Report" on a template's page: a disclosure with a one-line reason, sent once to
 *       /api/templates/<id>/report. What happened (thanks, already reported, an error) is said
 *       in the page; once sent, the form is gone.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, Disclosure, TextInput } from "@haruhimemoe/ui";
import { useState } from "react";
import { REPORT_REASON_MAX } from "@/constants/templates";
import { errorMessageOf, sendJson } from "@/utils/api-client";

const SENT = "Thanks. An admin will look at it.";

/**
 * @function ReportForm
 * @param props {{ templateId: string }} the template to report
 * @returns {JSX.Element} the report disclosure, or what happened
 */
export function ReportForm({ templateId }: { templateId: string }) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (done) {
    return (
      <p role="status" className="text-c2 text-sm">
        {done}
      </p>
    );
  }
  const send = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await sendJson(`/api/templates/${templateId}/report`, "POST", { reason });
      if (response.ok) setDone(SENT);
      else if (response.status === 409) setDone(await errorMessageOf(response, "Reporting failed"));
      else setError(await errorMessageOf(response, "Reporting failed"));
    } catch {
      setError("Couldn't reach bb. Try again.");
    }
    setPending(false);
  };
  return (
    <Disclosure summary="Report this template">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <TextInput
          id="report-reason"
          label="What's wrong with it?"
          value={reason}
          maxLength={REPORT_REASON_MAX}
          minLength={3}
          required
          error={error ?? undefined}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="self-start">
          {pending ? "Sending…" : "Send report"}
        </Button>
      </form>
    </Disclosure>
  );
}
