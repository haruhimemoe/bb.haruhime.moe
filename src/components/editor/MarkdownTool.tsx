/**
 * @file src/components/editor/MarkdownTool.tsx
 * @desc The toolbar's markdown tool. Paste markdown in: @haruhimemoe/bbcode/markdown converts it
 *       as you type, lists what the conversion loses, and Insert or Replace all (which asks first
 *       when the post has text) puts the BBCode in the editor. Copy as markdown writes the post
 *       to the clipboard as markdown (or shows it in a field when the browser refuses) and marks
 *       what had no markdown form in the editor until the next change. All in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import {
  type FromMarkdownOptions,
  fromMarkdown,
  type Loss,
  toMarkdown,
} from "@haruhimemoe/bbcode/markdown";
import { Button, ChoiceChips, ConfirmDialog, Notice, Surface, Textarea } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { summarizeLosses } from "@/utils/markdown";
import { insert, replaceAll, type TextEdit } from "@/utils/text-edit";

type HeadingStyle = NonNullable<FromMarkdownOptions["headingStyle"]>;

const HEADING_STYLES: readonly HeadingStyle[] = ["heading", "bold"];

type MarkdownToolProps = {
  onEdit: (edit: TextEdit) => void;
  /** The editor's whole text. */
  document: () => string;
  /** Marks Copy as markdown's losses in the editor. */
  onMarks: (lost: readonly Loss[]) => void;
};

type Copy = { text: string; fallback: string | null } | null;

/**
 * @function MarkdownTool
 * @param props {MarkdownToolProps} the edit handler, the text reader and the mark handler
 * @returns {JSX.Element} the markdown field, what it loses, Insert, Replace all and Copy
 */
export function MarkdownTool({ onEdit, document, onMarks }: MarkdownToolProps) {
  const t = useTranslations("bb.markdown");
  const [text, setText] = useState("");
  const [headingStyle, setHeadingStyle] = useState<HeadingStyle>("heading");
  const [confirming, setConfirming] = useState(false);
  const [copy, setCopy] = useState<Copy>(null);
  const typed = useDeferredValue(text);
  const converted = useMemo(
    () => (typed.trim() === "" ? null : fromMarkdown(typed, { headingStyle })),
    [typed, headingStyle],
  );
  const summary = converted ? summarizeLosses(converted.lost) : [];
  const empty = text.trim() === "";
  // Read at click time so a fast paste-then-click never inserts a stale conversion.
  const output = () => fromMarkdown(text, { headingStyle }).output;
  const replace = () => {
    onEdit(replaceAll(output()));
    setText("");
  };
  const copyOut = async () => {
    const { output: markdown, lost } = toMarkdown(document());
    onMarks(lost);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopy({ text: t("copied", { count: lost.length }), fallback: null });
    } catch {
      setCopy({ text: t("copyFallback"), fallback: markdown });
    }
  };
  return (
    <Surface
      as="form"
      aria-label={t("label")}
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-3"
    >
      <Textarea
        id="bb-markdown"
        label={t("field")}
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-sm"
      />
      <ChoiceChips
        label={t("headingStyle")}
        options={HEADING_STYLES.map((value) => ({ value, label: t(`headingStyles.${value}`) }))}
        value={headingStyle}
        onChange={setHeadingStyle}
      />
      {converted ? (
        summary.length === 0 ? (
          <p className="text-c3 text-xs">{t("nothingLost")}</p>
        ) : (
          <div className="text-c3 text-xs">
            <p>{t("dropped")}</p>
            <ul className="list-disc pl-5">
              {summary.map(({ code, count }) => (
                <li key={code}>{t(`losses.${code}`, { count })}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={empty}
          onClick={() => {
            onEdit(insert(output()));
            setText("");
          }}
        >
          {t("insert")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={empty}
          onClick={() => (document().trim() === "" ? replace() : setConfirming(true))}
        >
          {t("replace")}
        </Button>
        <Button type="button" variant="secondary" onClick={copyOut}>
          {t("copy")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("confirmTitle")}
        description={t("confirmBody")}
        confirmLabel={t("confirm")}
        tone="destructive"
        onConfirm={replace}
      />
      {copy?.fallback != null ? (
        <Textarea
          id="bb-markdown-copy"
          label={t("copyField")}
          value={copy.fallback}
          readOnly
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-sm"
        />
      ) : null}
      <Notice tone={copy?.fallback != null ? "warning" : "info"} live>
        {copy?.text ?? ""}
      </Notice>
    </Surface>
  );
}
