/**
 * @file src/components/account/ApiKeySection.tsx
 * @desc /account "API key" card: create an hbb_ key, show it once (read-only field, Copy, "I've
 *       saved it"), then only its prefix and dates. Regenerate and revoke each ask first with
 *       @haruhimemoe/ui's InlineConfirm. When a step swaps what the card shows, focus moves to
 *       the revealed key or the next button, and the outcome is announced in a polite live
 *       region.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sat Oct 3, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import type { ApiKeyCreated, ApiKeyInfo } from "@haruhimemoe/next-kit/api-keys";
import {
  Button,
  Card,
  CopyField,
  cx,
  InlineConfirm,
  Notice,
  Text,
  TextLink,
  textClasses,
} from "@haruhimemoe/ui";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { API_DOCS_PATH } from "@/constants/api";
import { errorMessageOf, sendJson } from "@/utils/api-client";
import { formatShortDate } from "@/utils/date";

const PATH = "/api/me/api-key";

/** Where to send focus after the next render: the revealed key, Regenerate, or Create. */
type FocusTarget = "reveal" | "existing" | "empty" | null;

/**
 * @function ApiKeySection
 * @param props {{ initial: ApiKeyInfo | null }} the account's key, or null if it has none
 * @returns {JSX.Element} the API key card
 */
export function ApiKeySection({ initial }: { initial: ApiKeyInfo | null }) {
  const t = useTranslations("bb.apiKey");
  const ui = useTranslations("ui");
  const locale = useLocale();
  const [apiKey, setApiKey] = useState<ApiKeyInfo | null>(initial);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [pendingFocus, setPendingFocus] = useState<FocusTarget>(null);
  const keyFieldId = useId();

  const revealedInputRef = useRef<HTMLInputElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const regenerateRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (pendingFocus === null) return;
    const targets: Record<Exclude<FocusTarget, null>, HTMLElement | null | undefined> = {
      reveal: revealedInputRef.current,
      existing: regenerateRef.current?.querySelector("button"),
      empty: createButtonRef.current,
    };
    targets[pendingFocus]?.focus();
    setPendingFocus(null);
  }, [pendingFocus]);

  /** Runs one call at a time; a failure sets the error and rejects, so a confirm stays open. */
  const run = async (action: () => Promise<void>) => {
    // `busy` disables buttons only after a render; two clicks in one frame must not both run.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  const create = () =>
    run(async () => {
      const response = await sendJson(PATH, "POST");
      if (!response.ok) {
        const message = await errorMessageOf(response, t("createFailed"));
        setError(message);
        throw new Error(message);
      }
      const body = (await response.json()) as ApiKeyCreated;
      setApiKey(body.apiKey);
      setRevealed(body.key);
      setStatus(t("created"));
      setPendingFocus("reveal");
    });

  const revoke = () =>
    run(async () => {
      const response = await sendJson(PATH, "DELETE");
      if (!response.ok) {
        const message = await errorMessageOf(response, t("revokeFailed"));
        setError(message);
        throw new Error(message);
      }
      setApiKey(null);
      setStatus(t("revoked"));
      setPendingFocus("empty");
    });

  const saved = () => {
    setRevealed(null);
    setStatus(t("saved"));
    setPendingFocus("existing");
  };

  return (
    <Card title={t("title")}>
      <Text tone="muted">
        {t("lead")} <TextLink href={API_DOCS_PATH}>{t("docs")}</TextLink>
      </Text>
      <div className="mt-3 flex flex-col gap-3">
        {revealed !== null ? (
          <>
            <p className="font-bold text-c1 text-sm">{t("copyNow")}</p>
            <CopyField
              id={keyFieldId}
              ref={revealedInputRef}
              label={t("newKey")}
              value={revealed}
              copyLabel={ui("actions.copy")}
              copiedMessage={t("copied")}
              failedMessage={t("copyFailed")}
            />
            <Button variant="ghost" onClick={saved}>
              {t("savedIt")}
            </Button>
          </>
        ) : apiKey === null ? (
          <Button
            ref={createButtonRef}
            variant="secondary"
            onClick={() => create().catch(() => undefined)}
            disabled={busy}
          >
            {t("create")}
          </Button>
        ) : (
          <>
            <p className="text-c2 text-sm">
              <code className="font-mono text-c1">{apiKey.prefix}…</code>{" "}
              {t("createdOn", { date: formatShortDate(apiKey.createdAt, locale) })}{" "}
              {apiKey.lastUsedAt
                ? t("lastUsed", { date: formatShortDate(apiKey.lastUsedAt, locale) })
                : t("notUsed")}
            </p>
            <div ref={regenerateRef} className="flex flex-wrap items-center gap-2">
              <InlineConfirm
                trigger={t("regenerate")}
                triggerProps={{ disabled: busy }}
                question={t("regenerateQuestion")}
                cancelLabel={t("keep")}
                confirmLabel={t("confirmRegenerate")}
                confirmVariant="danger"
                onConfirm={create}
              />
              <InlineConfirm
                trigger={t("revoke")}
                triggerProps={{ variant: "ghost", disabled: busy }}
                question={t("revokeQuestion")}
                cancelLabel={t("keep")}
                confirmLabel={t("confirmRevoke")}
                confirmVariant="danger"
                onConfirm={revoke}
              />
            </div>
          </>
        )}
      </div>
      <output aria-live="polite" className={cx("mt-2 block", textClasses({ tone: "muted" }))}>
        {status}
      </output>
      {error ? (
        <Notice tone="error" live className="font-bold">
          {error}
        </Notice>
      ) : null}
    </Card>
  );
}
