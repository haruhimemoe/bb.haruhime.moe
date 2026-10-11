/**
 * @file src/components/account/DeleteBbDataForm.tsx
 * @desc /account "Delete my bb data": ui's ConfirmDialog (type the osu! username), then DELETE
 *       /api/account. 204 means gone: the card says so and the person stays signed in, since
 *       the haruhime account itself lives on haruhime.moe. A refusal shows the server's message
 *       in the dialog, which stays open. Shaped after next-kit's DeleteAccountForm, whose words
 *       ("Delete my account", "Your account is deleted") would promise more than bb can delete.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { ConfirmDialog, Text } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/**
 * @function messageOf
 * @param response {Response} a refusal
 * @param fallback {string} what to say when the server gives no message
 * @returns {Promise<string>} the server's message, or the fallback
 */
const messageOf = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * @function DeleteBbDataForm
 * @param props {{ username: string; deletes: string }} the osu! username to type, and what goes
 * @returns {JSX.Element} the trigger and its confirm dialog, or the line saying it's done
 */
export function DeleteBbDataForm({ username, deletes }: { username: string; deletes: string }) {
  const t = useTranslations("bb.account.delete");
  const ui = useTranslations("ui");
  const unreachable = t("unreachable");
  const doneId = `${useId()}-done`;
  const [done, setDone] = useState(false);

  const remove = async () => {
    let response: Response;
    try {
      response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
    } catch {
      throw new Error(unreachable);
    }
    if (!response.ok) {
      throw new Error(await messageOf(response, t("failed", { status: response.status })));
    }
    setDone(true);
  };

  if (done) {
    return (
      <Text id={doneId} role="status" tabIndex={-1} tone="muted" className="outline-none">
        {t("done")}
      </Text>
    );
  }
  return (
    <ConfirmDialog
      trigger={t("trigger")}
      triggerProps={{ variant: "danger" }}
      title={t("title")}
      description={deletes}
      tone="destructive"
      typeToConfirm={{
        expected: username,
        label: ui("forms.typeToConfirm", { expected: username }),
      }}
      confirmLabel={t("confirm")}
      pendingLabel={t("pending")}
      cancelLabel={ui("actions.cancel")}
      failedMessage={(error) => (error instanceof Error ? error.message : unreachable)}
      returnFocus={() => document.getElementById(doneId)}
      onConfirm={remove}
    />
  );
}
