/**
 * @file src/components/me/ProposeForm.tsx
 * @desc On a fork's edit page: offer this copy's BBCode and fields to the template it copied,
 *       with an optional note (POST /api/templates/<fork>/propose). Says when it went, or why
 *       not (no changes, the original gone, the rate limit). Proposing again replaces the open
 *       proposal, which can also be withdrawn (DELETE /api/templates/<fork>/proposals/<id>).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Card, Notice, Text, TextInput } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PROPOSAL_MESSAGE_MAX } from "@/schemas/proposal";
import { errorMessageOf, sendJson } from "@/utils/api-client";

type ProposeFormProps = {
  /** The fork. */
  templateId: string;
  /** The template it copied. */
  upstreamName: string;
  /** This fork's open proposal, if there is one. */
  proposalId?: string | null;
};

/**
 * @function ProposeForm
 * @param props {ProposeFormProps} the fork and its original's name
 * @returns {JSX.Element} the note, Propose and what happened
 */
export function ProposeForm({ templateId, upstreamName, proposalId = null }: ProposeFormProps) {
  const t = useTranslations("bb.proposals");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(proposalId);
  const send = async () => {
    setBusy(true);
    setSaid(null);
    try {
      const response = await sendJson(`/api/templates/${templateId}/propose`, "POST", { message });
      if (response.ok) {
        const { proposal } = (await response.json()) as { proposal: { id: string } };
        setOpen(proposal.id);
        setSaid({ tone: "info", text: t("propose.sent", { name: upstreamName }) });
      } else {
        const text = await errorMessageOf(response, t("failed", { status: response.status }));
        setSaid({ tone: "error", text });
      }
    } catch {
      setSaid({ tone: "error", text: t("offline") });
    }
    setBusy(false);
  };
  const withdraw = async () => {
    setBusy(true);
    try {
      const response = await sendJson(`/api/templates/${templateId}/proposals/${open}`, "DELETE");
      if (response.ok || response.status === 404) setOpen(null);
      setSaid(
        response.ok
          ? { tone: "info", text: t("propose.withdrawn") }
          : {
              tone: "error",
              text: await errorMessageOf(response, t("failed", { status: response.status })),
            },
      );
    } catch {
      setSaid({ tone: "error", text: t("offline") });
    }
    setBusy(false);
  };
  return (
    <Card title={t("propose.title", { name: upstreamName })}>
      <div className="flex flex-col gap-3">
        <Text tone="muted">{t("propose.lead")}</Text>
        {open ? (
          <div className="flex flex-wrap items-center gap-3">
            <Text>{t("propose.open", { name: upstreamName })}</Text>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void withdraw()}
            >
              {t("propose.withdraw")}
            </Button>
          </div>
        ) : null}
        <TextInput
          id="bb-propose-message"
          label={t("propose.message")}
          value={message}
          maxLength={PROPOSAL_MESSAGE_MAX}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void send()}>
            {busy ? t("propose.sending") : t("propose.send")}
          </Button>
          <Notice tone={said?.tone ?? "info"} live>
            {said?.text ?? ""}
          </Notice>
        </div>
      </div>
    </Card>
  );
}
