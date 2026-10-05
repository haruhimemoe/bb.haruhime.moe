/**
 * @file src/components/editor/ColorTool.tsx
 * @desc The toolbar's color tool: a picker, a field for a hex code or a color name, and swatches
 *       of names osu! accepts. It shows a sample on the preview's background and warns when the
 *       WCAG contrast against it is under 3:1; "Color the selection" wraps it in [color=...].
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Oct 5, 2026
 */

"use client";

import { normalizeColor } from "@haruhimemoe/bbcode/helpers";
import { Button, Notice, Surface, TextInput } from "@haruhimemoe/ui";
import { useState } from "react";
import { MIN_CONTRAST, SWATCHES } from "@/constants/colors";
import { PREVIEW_BACKGROUND } from "@/constants/editor";
import { colorEdit } from "@/constants/toolbar";
import { colorHex, contrastRatio } from "@/utils/contrast";
import type { TextEdit } from "@/utils/text-edit";

type ColorToolProps = {
  onEdit: (edit: TextEdit) => void;
};

const normalized = (value: string): string | null => {
  try {
    return normalizeColor(value.trim());
  } catch {
    return null;
  }
};

/**
 * @function ColorTool
 * @param props {ColorToolProps} the edit handler
 * @returns {JSX.Element} the picker, the field, the swatches, the contrast check and the button
 */
export function ColorTool({ onEdit }: ColorToolProps) {
  const [value, setValue] = useState("#ff66aa");
  const color = normalized(value);
  const hex = color ? colorHex(color) : null;
  const ratio = hex ? contrastRatio(hex, PREVIEW_BACKGROUND) : null;
  return (
    <Surface as="section" aria-label="Color" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-bold text-c2 text-sm">
          Picker
          <input
            type="color"
            value={hex ?? "#ffffff"}
            onChange={(event) => setValue(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded bg-transparent"
          />
        </label>
        <TextInput
          id="bb-color-value"
          label="Hex code or color name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={color ? undefined : "Use #rrggbb, #rgb or a color name in letters."}
          spellCheck={false}
        />
        <p
          className="rounded px-3 py-2 font-bold text-sm"
          style={{ background: PREVIEW_BACKGROUND, color: hex ?? undefined }}
        >
          Sample text
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Color names osu! accepts">
        {SWATCHES.map((swatch) => (
          <li key={swatch.value}>
            <button
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={color === swatch.value}
              onClick={() => setValue(swatch.value)}
              className="h-6 w-6 rounded-full border border-b2 aria-pressed:outline-2 aria-pressed:outline-h1"
              style={{ background: swatch.hex }}
            />
          </li>
        ))}
      </ul>
      {ratio !== null && ratio < MIN_CONTRAST ? (
        <Notice tone="warning">
          Hard to read on osu!'s dark background: contrast {ratio.toFixed(1)}:1. Aim for{" "}
          {MIN_CONTRAST}:1 or more.
        </Notice>
      ) : null}
      {ratio !== null && ratio >= MIN_CONTRAST ? (
        <Notice>Contrast {ratio.toFixed(1)}:1 on osu!'s dark background.</Notice>
      ) : null}
      {color && hex === null ? (
        <Notice>bb can't check this name's contrast. Look at it in the preview.</Notice>
      ) : null}
      <div>
        <Button disabled={!color} onClick={() => color && onEdit(colorEdit(color))}>
          Color the selection
        </Button>
      </div>
    </Surface>
  );
}
