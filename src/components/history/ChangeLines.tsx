/**
 * @file src/components/history/ChangeLines.tsx
 * @desc What a change does to a template, as a list: a line per renamed, re-described or
 *       re-kinded template and per field added, removed or moved, and the body's change as a line
 *       diff (BodyDiff). Shared by a revision's change view and a proposal. Server-safe.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { useTranslations } from "next-intl";
import { BodyDiff } from "@/components/history/BodyDiff";
import type { TemplateChangeLine } from "@/utils/template-changes";

type ChangeLinesProps = { lines: readonly TemplateChangeLine[] };

/**
 * @function ChangeLines
 * @param props {ChangeLinesProps} the change lines (src/utils/template-changes.ts)
 * @returns {JSX.Element} the list
 */
export function ChangeLines({ lines }: ChangeLinesProps) {
  const t = useTranslations("bb");
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line, i) =>
        line.kind === "body" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: change lines never reorder
          <li key={i}>
            <BodyDiff diff={line.diff} />
          </li>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: change lines never reorder
          <li key={i}>
            {t(`history.lines.${line.key}`, {
              ...line.values,
              ...(line.key === "kind" ? { kind: t(`kinds.${line.values.kind}`) } : {}),
            })}
          </li>
        ),
      )}
    </ul>
  );
}
