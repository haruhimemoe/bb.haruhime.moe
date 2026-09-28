/**
 * @file src/components/account/DeleteAccountForm.tsx
 * @desc "Delete my account" on /account. The confirmation is built into the page (no confirm()
 *       dialog): the button stays off until the osu! username is typed exactly, then one DELETE
 *       /api/account carries it. On success the header shows signed out and the page says the
 *       account is deleted (the form doesn't come back) and goes home; a refusal or no answer is
 *       said in the page, and nothing was deleted.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { ButtonLink, TypeToConfirm } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { markSignedOut } from "@/lib/account";
import { errorMessageOf } from "@/utils/api-client";

const UNREACHABLE = "Couldn't reach bb. Your account is still there.";

type DeleteAccountFormProps = {
  /** The signed-in osu! username, typed to confirm. */
  username: string;
  /** How many templates they own, for the warning. */
  templateCount: number;
};

/**
 * @function DeleteAccountForm
 * @param props {DeleteAccountFormProps} the username to type and the templates that go
 * @returns {JSX.Element} the typed-name confirmation (ui's TypeToConfirm), or what happened
 */
export function DeleteAccountForm({ username, templateCount }: DeleteAccountFormProps) {
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  // Once it's gone the form doesn't come back, so a second press can't send the delete again.
  const [done, setDone] = useState(false);
  const remove = async () => {
    setError(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        setError(await errorMessageOf(response, "Deleting failed"));
        return;
      }
      markSignedOut();
      setDone(true);
      router.push("/");
    } catch {
      setError(UNREACHABLE);
    }
  };
  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="text-c2 text-sm">
          Your account is deleted.
        </p>
        <ButtonLink href="/" variant="secondary" className="self-start">
          Go to the editor
        </ButtonLink>
      </div>
    );
  }
  const owned =
    templateCount === 1
      ? "your template"
      : `all ${templateCount.toLocaleString("en-US")} of your templates`;
  return (
    <TypeToConfirm
      id={id}
      expected={username}
      submitLabel="Delete my account"
      pendingLabel="Deleting…"
      error={error}
      onConfirm={remove}
    >
      <p className="text-c2 text-sm">
        This deletes your account and{" "}
        {templateCount === 0 ? "signs you out" : `${owned}, and signs you out`} everywhere. Drafts
        saved in your browser stay there. It can't be undone.
      </p>
    </TypeToConfirm>
  );
}
