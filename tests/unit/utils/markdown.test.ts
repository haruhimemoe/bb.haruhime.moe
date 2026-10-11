/**
 * @file tests/unit/utils/markdown.test.ts
 * @desc The markdown tool's helpers: losses grouped in LOSS_CODES order with counts, and each
 *       loss as an info diagnostic over its range.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { fromMarkdown, type Loss } from "@haruhimemoe/bbcode/markdown";
import { describe, expect, it } from "vitest";
import { lossToDiagnostic, summarizeLosses } from "@/utils/markdown";

const loss = (code: Loss["code"], start = 0, end = 1): Loss => ({
  code,
  message: `${code} message`,
  start,
  end,
});

describe("summarizeLosses", () => {
  it("is empty when nothing was lost", () => {
    expect(summarizeLosses([])).toEqual([]);
  });

  it("counts by code in LOSS_CODES order, whatever order they came in", () => {
    expect(
      summarizeLosses([loss("html"), loss("table"), loss("html"), loss("no-equivalent")]),
    ).toEqual([
      { code: "no-equivalent", count: 1 },
      { code: "table", count: 1 },
      { code: "html", count: 2 },
    ]);
  });

  it("summarizes a real conversion", () => {
    const { lost } = fromMarkdown("## Two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(summarizeLosses(lost).map((one) => one.code)).toEqual(["table", "heading-level"]);
  });
});

describe("lossToDiagnostic", () => {
  it("is an info mark over the loss's range, from the markdown source", () => {
    expect(lossToDiagnostic(loss("no-equivalent", 3, 9))).toEqual({
      from: 3,
      to: 9,
      severity: "info",
      source: "markdown",
      message: "no-equivalent message",
    });
  });
});
