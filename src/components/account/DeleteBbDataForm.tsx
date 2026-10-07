/**
 * @file src/components/account/DeleteBbDataForm.tsx
 * @desc /account "Delete my bb data": ui's ConfirmDialog (type the osu! username), then DELETE
 *       /api/account. 204 means gone: the card says so and the person stays signed in, since
 *       the haruhime account itself lives on haruhime.moe. A refusal shows the server's message
 *       in the dialog, which stays open. Shaped after next-kit's DeleteAccountForm, whose words
 *       ("Delete my account", "Your account is deleted") would promise more than bb can delete.
 * @author David @dvhsh (https://dvh.sh)
 * @created Tue Oct 6, 2026
 * @modified Tue Oct 6, 2026
 */

"use client";

import { ConfirmDialog, Text } from "@haruhimemoe/ui";
import { useId, useState } from "react";

const UNREACHABLE = "Couldn't reach bb. Nothing was deleted.";

/**
 * @function messageOf
 * @param response {Response} a refusal
 * @returns {Promise<string>} the server's message, or the status
 */
const messageOf = async (response: Response): Promise<string> => {
  const fallback = `Deleting failed (${response.status}).`;
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
      throw new Error(UNREACHABLE);
    }
    if (!response.ok) throw new Error(await messageOf(response));
    setDone(true);
  };

  if (done) {
    return (
      <Text id={doneId} role="status" tabIndex={-1} tone="muted" className="outline-none">
        Your bb data is deleted.
      </Text>
    );
  }
  return (
    <ConfirmDialog
      trigger="Delete my bb data"
      triggerProps={{ variant: "danger" }}
      title="Delete your bb data?"
      description={deletes}
      tone="destructive"
      typeToConfirm={username}
      confirmLabel="Delete for good"
      pendingLabel="Deleting…"
      failedMessage={(error) => (error instanceof Error ? error.message : UNREACHABLE)}
      returnFocus={() => document.getElementById(doneId)}
      onConfirm={remove}
    />
  );
}
