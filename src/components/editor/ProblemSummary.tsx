/**
 * @file src/components/editor/ProblemSummary.tsx
 * @desc Under the editor: what lint finds in the post ("No problems" or "1 error, 2 warnings"),
 *       Show problems (CodeMirror's list under the editor) and Fix all, when some of them have
 *       an obvious fix, which then says how many it fixed. Counts the same diagnostics the
 *       editor marks.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Notice, textClasses } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { POST_LIMIT } from "@/constants/editor";
import { lintBbcode } from "@/lib/bbcode";
import { countProblems } from "@/utils/lint-fixes";

type ProblemSummaryProps = {
  /** The post's text (a deferred copy is fine). */
  text: string;
  /** Opens the list of problems. */
  onShow: () => void;
  /** Applies every fix; how many it applied. */
  onFixAll: () => number;
};

/**
 * @function ProblemSummary
 * @param props {ProblemSummaryProps} the text, Show and Fix all
 * @returns {JSX.Element} the counts, Show problems, Fix all and what it fixed
 */
export function ProblemSummary({ text, onShow, onFixAll }: ProblemSummaryProps) {
  const t = useTranslations("bb.problems");
  const [fixed, setFixed] = useState<number | null>(null);
  const { errors, warnings, fixable } = useMemo(
    () => countProblems(lintBbcode(text, POST_LIMIT)),
    [text],
  );
  const none = errors + warnings === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className={textClasses({ tone: none ? "muted" : "default" })}>
        {none
          ? t("none")
          : t("summary", { errors, warnings, both: errors > 0 && warnings > 0 ? "yes" : "no" })}
      </p>
      {none ? null : (
        <Button type="button" variant="secondary" size="sm" onClick={onShow}>
          {t("show")}
        </Button>
      )}
      {fixable > 0 ? (
        <Button type="button" size="sm" onClick={() => setFixed(onFixAll())}>
          {t("fixAll", { count: fixable })}
        </Button>
      ) : null}
      <Notice live>{fixed ? t("fixed", { count: fixed }) : ""}</Notice>
    </div>
  );
}
