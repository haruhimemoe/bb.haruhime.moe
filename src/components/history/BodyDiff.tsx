/**
 * @file src/components/history/BodyDiff.tsx
 * @desc A template body's line diff: inserted lines marked `+`, deleted lines marked `-` and
 *       struck through; an unchanged run over 6 lines collapses to its first and last 3 with how
 *       many lines sit between. Server-safe.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Sun Oct 11, 2026
 */

import type { TextDiff } from "@haruhimemoe/vcs/text";
import { useTranslations } from "next-intl";

type BodyDiffProps = { diff: TextDiff };

const CONTEXT_LINES = 3;
const COLLAPSE_OVER = 6;

const strip = (line: string) => line.replace(/\n$/, "");

/** One line in the rendered diff: marked and colored, or a count of unchanged lines. */
type DiffLine = { text: string; mark: string; className: string } | { hidden: number };

const linesOf = (run: TextDiff[number]): DiffLine[] => {
  if (run.op === "insert") {
    return run.lines.map((line) => ({
      text: strip(line),
      mark: "+ ",
      className: "font-bold text-c1",
    }));
  }
  if (run.op === "delete") {
    return run.lines.map((line) => ({
      text: strip(line),
      mark: "- ",
      className: "text-c3 line-through",
    }));
  }
  if (run.lines.length <= COLLAPSE_OVER) {
    return run.lines.map((line) => ({ text: strip(line), mark: "  ", className: "" }));
  }
  const head = run.lines.slice(0, CONTEXT_LINES);
  const tail = run.lines.slice(-CONTEXT_LINES);
  const hidden = run.lines.length - head.length - tail.length;
  return [
    ...head.map((line) => ({ text: strip(line), mark: "  ", className: "" })),
    { hidden },
    ...tail.map((line) => ({ text: strip(line), mark: "  ", className: "" })),
  ];
};

/**
 * @function BodyDiff
 * @param props {BodyDiffProps} the body's line diff
 * @returns {JSX.Element} the diff as a `<pre>`, added and removed lines marked and colored, long
 *          unchanged runs collapsed
 */
export function BodyDiff({ diff }: BodyDiffProps) {
  const t = useTranslations("bb.history");
  const lines = diff.flatMap(linesOf);
  return (
    <section aria-label={t("bodyChanges")}>
      <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
        {lines.map((line, i) =>
          "hidden" in line ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines never reorder within a render
            <span key={i} className="block text-c3 italic">
              {t("unchanged", { count: line.hidden })}
            </span>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines never reorder within a render
            <span key={i} className={`block ${line.className}`}>
              {line.mark}
              {line.text}
            </span>
          ),
        )}
      </pre>
    </section>
  );
}
