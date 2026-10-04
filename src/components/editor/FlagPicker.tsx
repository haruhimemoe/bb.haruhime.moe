/**
 * @file src/components/editor/FlagPicker.tsx
 * @desc The toolbar's flag picker: search countries by name or code (@haruhimemoe/bbcode/flags),
 *       choose the small PNG flags (the default) or the current SVG ones, and a click inserts the
 *       flag's [img] (the package's flag helper). The flag images load from osu!'s own servers.
 *       SVG flags fill the width they're shown in, which the picker says.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 4, 2026
 */

"use client";

import { type FlagStyle, flagUrl, searchCountries } from "@haruhimemoe/bbcode/flags";
import { flag } from "@haruhimemoe/bbcode/helpers";
import { ChoiceChips, Notice, Text, TextInput } from "@haruhimemoe/ui";
import { useState } from "react";
import { insert, type TextEdit } from "@/utils/text-edit";

type FlagPickerProps = {
  onEdit: (edit: TextEdit) => void;
};

/** The most countries listed at once. */
const MAX_RESULTS = 24;

const STYLES = [
  { value: "legacy", label: "Small (PNG)" },
  { value: "modern", label: "Current (SVG)" },
] as const;

/**
 * @function FlagPicker
 * @param props {FlagPickerProps} the edit handler
 * @returns {JSX.Element} the search, the style choice, the SVG note when SVG is chosen and the matching countries
 */
export function FlagPicker({ onEdit }: FlagPickerProps) {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<FlagStyle>("legacy");
  const found = query.trim() === "" ? [] : searchCountries(query).slice(0, MAX_RESULTS);
  return (
    <section aria-label="Flag" className="flex flex-col gap-3 rounded-md bg-b4 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          id="bb-flag-search"
          label="Country"
          type="search"
          placeholder="Japan or JP"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <ChoiceChips label="Flag style" options={STYLES} value={style} onChange={setStyle} />
      </div>
      {style === "modern" ? (
        <Notice>
          SVG flags have no size of their own, so they fill the width of the page or box they're in.
          osu! also shows images through its own proxy, and bb can't check that it passes SVG. The
          small PNG flags are about a line of text high.
        </Notice>
      ) : null}
      {query.trim() !== "" && found.length === 0 ? (
        <Text tone="muted">No country matches "{query.trim()}".</Text>
      ) : null}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-1.5">
        {found.map((country) => (
          <li key={country.code}>
            <button
              type="button"
              aria-label={`${country.name} (${country.code})`}
              onClick={() => onEdit(insert(flag(country.code, { style })))}
              className="flex w-full items-center gap-2 rounded-md bg-b5 px-2 py-1.5 text-left text-c2 text-sm hover:bg-b3 hover:text-c1"
            >
              {/* biome-ignore lint/performance/noImgElement: a flag from osu!'s servers, shown as is. */}
              <img
                src={flagUrl(country.code, style)}
                alt=""
                width={24}
                height={16}
                loading="lazy"
              />
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              <span className="font-mono text-c4 text-xs">{country.code}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
