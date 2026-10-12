/**
 * @file src/components/editor/FlagPicker.tsx
 * @desc The toolbar's flag picker: the flags used last and every country before a search, or
 *       the countries matching it by name or code (@haruhimemoe/bbcode/flags); small PNG flags
 *       (the default) or the current SVG ones. A click inserts the flag's [img] (the package's
 *       flag helper) and leaves the picker open for the next, saying what went in. The flag
 *       images load from osu!'s own servers. SVG flags fill the width they're shown in, which
 *       the picker says.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import {
  COUNTRIES,
  type Country,
  type FlagStyle,
  findCountry,
  flagUrl,
  searchCountries,
} from "@haruhimemoe/bbcode/flags";
import { flag } from "@haruhimemoe/bbcode/helpers";
import { ChoiceChips, Notice, Surface, Text, TextInput } from "@haruhimemoe/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { RECENT_FLAGS_KEY, RECENT_FLAGS_MAX } from "@/constants/editor";
import { loadRecents, pushRecent, saveRecents } from "@/utils/recents";
import { insert, type TextEdit } from "@/utils/text-edit";

type FlagPickerProps = {
  onEdit: (edit: TextEdit) => void;
};

/** The most countries listed for a search. */
const MAX_RESULTS = 24;

const STYLES = ["legacy", "modern"] as const;

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-1.5";

/** A country's name in the page's language, else the package's English name. */
const regionName = (names: Intl.DisplayNames | null, code: string, fallback: string): string => {
  try {
    return names?.of(code) ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * @function FlagPicker
 * @param props {FlagPickerProps} the edit handler
 * @returns {JSX.Element} the search, the style choice, the SVG note when SVG is chosen, and the
 *          recent and all countries or the matching ones
 */
export function FlagPicker({ onEdit }: FlagPickerProps) {
  const t = useTranslations("bb.flag");
  const locale = useLocale();
  const names = locale === "en" ? null : new Intl.DisplayNames([locale], { type: "region" });
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<FlagStyle>("legacy");
  const [recent, setRecent] = useState(() => loadRecents(RECENT_FLAGS_KEY, RECENT_FLAGS_MAX));
  const [inserted, setInserted] = useState("");
  const searching = query.trim() !== "";
  const found = searching ? searchCountries(query).slice(0, MAX_RESULTS) : [];
  const recentCountries = recent.flatMap((code) => findCountry(code) ?? []);
  const pick = (country: Country, name: string) => {
    onEdit(insert(flag(country.code, { style })));
    const next = pushRecent(recent, country.code, RECENT_FLAGS_MAX);
    setRecent(next);
    saveRecents(RECENT_FLAGS_KEY, next);
    setInserted(t("inserted", { name }));
  };
  const list = (countries: readonly Country[], label?: string) => (
    <ul aria-label={label} className={GRID}>
      {countries.map((country) => {
        const name = regionName(names, country.code, country.name);
        return (
          <li key={country.code}>
            <button
              type="button"
              aria-label={t("name", { name, code: country.code })}
              onClick={() => pick(country, name)}
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
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <span className="font-mono text-c4 text-xs">{country.code}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          id="bb-flag-search"
          label={t("country")}
          type="search"
          placeholder={t("placeholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <ChoiceChips
          label={t("style")}
          options={STYLES.map((value) => ({ value, label: t(`styles.${value}`) }))}
          value={style}
          onChange={setStyle}
        />
      </div>
      {style === "modern" ? <Notice>{t("svgNote")}</Notice> : null}
      {searching && found.length === 0 ? (
        <Text tone="muted">{t("none", { query: query.trim() })}</Text>
      ) : null}
      {searching ? list(found) : null}
      {!searching && recentCountries.length > 0 ? (
        <>
          <h3 className="font-bold text-c3 text-xs">{t("recent")}</h3>
          {list(recentCountries, t("recent"))}
        </>
      ) : null}
      {searching ? null : (
        <>
          <h3 className="font-bold text-c3 text-xs">{t("all")}</h3>
          <div className="max-h-80 overflow-y-auto">{list(COUNTRIES)}</div>
        </>
      )}
      <Notice live>{inserted}</Notice>
    </Surface>
  );
}
