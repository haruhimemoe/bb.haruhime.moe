/**
 * @file src/components/editor/GradientTool.tsx
 * @desc The toolbar's gradient tool: the text (the selection when the tool opened), two to four
 *       color stops, and whether spaces are skipped. A live preview shows the result and how
 *       many characters the colors add (the package's gradient cost); "Insert gradient" puts the
 *       BBCode in place of the selection.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { gradient } from "@haruhimemoe/bbcode/helpers";
import { Button, Checkbox, Surface, Text, TextInput } from "@haruhimemoe/ui";
import { useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { DEFAULT_STOPS, STOPS_MAX, STOPS_MIN } from "@/constants/colors";
import { insert, type TextEdit } from "@/utils/text-edit";

type GradientToolProps = {
  /** The text to start with (the selection). */
  initialText: string;
  onEdit: (edit: TextEdit) => void;
};

/**
 * @function GradientTool
 * @param props {GradientToolProps} the starting text and the edit handler
 * @returns {JSX.Element} the text, the stops, the option, the preview with its cost, and Insert
 */
export function GradientTool({ initialText, onEdit }: GradientToolProps) {
  const [text, setText] = useState(initialText || "Gradient text");
  const [stops, setStops] = useState<string[]>([...DEFAULT_STOPS]);
  const [skipSpaces, setSkipSpaces] = useState(true);
  const result = text === "" ? null : gradient(text, stops, { skipSpaces });
  const setStop = (at: number, value: string) =>
    setStops((current) => current.map((stop, i) => (i === at ? value : stop)));
  return (
    <Surface as="section" aria-label="Gradient" className="flex flex-col gap-3">
      <TextInput
        id="bb-gradient-text"
        label="Text"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <fieldset className="flex min-w-0 flex-wrap items-end gap-2">
        <legend className="mb-1 font-bold text-c2 text-sm">Colors, first to last</legend>
        {stops.map((stop, at) => (
          <input
            // Stops are edited in place and only ever removed from the end.
            // biome-ignore lint/suspicious/noArrayIndexKey: the place is the stop's identity.
            key={at}
            type="color"
            aria-label={`Color ${at + 1}`}
            value={stop}
            onChange={(event) => setStop(at, event.target.value)}
            className="h-10 w-14 cursor-pointer rounded bg-transparent"
          />
        ))}
        <Button
          variant="secondary"
          disabled={stops.length >= STOPS_MAX}
          onClick={() => setStops((current) => [...current, current.at(-1) ?? "#ffffff"])}
        >
          Add color
        </Button>
        <Button
          variant="ghost"
          disabled={stops.length <= STOPS_MIN}
          onClick={() => setStops((current) => current.slice(0, -1))}
        >
          Remove last
        </Button>
      </fieldset>
      <Checkbox
        id="bb-gradient-skip"
        label="Skip spaces"
        hint="Spaces get no color of their own, which saves characters."
        checked={skipSpaces}
        onChange={(event) => setSkipSpaces(event.target.checked)}
      />
      {result ? (
        <>
          <BbPreview source={result.bbcode} fluid className="min-h-0" />
          <Text tone="muted" aria-live="polite">
            The colors add {result.cost.toLocaleString("en-US")} characters.
          </Text>
        </>
      ) : null}
      <div>
        <Button disabled={!result} onClick={() => result && onEdit(insert(result.bbcode))}>
          Insert gradient
        </Button>
      </div>
    </Surface>
  );
}
