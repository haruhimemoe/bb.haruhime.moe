/**
 * @file src/components/editor/EditorSettingsTool.tsx
 * @desc The toolbar's Settings panel: the source editor's font and text size, and whether tags
 *       close as you type and lists continue on Enter. Kept in this browser
 *       (useEditorSettings); the editor takes a change without losing its undo history.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Checkbox, ChoiceChips, Select, Surface, textClasses } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { EDITOR_FONT_SIZES, EDITOR_FONTS } from "@/constants/editor";
import type { EditorSettings } from "@/utils/editor-settings";

type EditorSettingsToolProps = {
  settings: EditorSettings;
  onChange: (next: EditorSettings) => void;
};

/**
 * @function EditorSettingsTool
 * @param props {EditorSettingsToolProps} the settings and their change handler
 * @returns {JSX.Element} the font, size and typing controls
 */
export function EditorSettingsTool({ settings, onChange }: EditorSettingsToolProps) {
  const t = useTranslations("bb.settings");
  const set = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) =>
    onChange({ ...settings, [key]: value });
  return (
    <Surface
      as="form"
      aria-label={t("label")}
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-3"
    >
      <ChoiceChips
        label={t("font")}
        options={EDITOR_FONTS.map((value) => ({ value, label: t(`fonts.${value}`) }))}
        value={settings.font}
        onChange={(font) => set("font", font)}
      />
      <Select
        id="bb-editor-size"
        label={t("size")}
        value={String(settings.size)}
        onChange={(event) => set("size", Number(event.target.value))}
        wrapperClassName="max-w-40"
      >
        {EDITOR_FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {t("sizeValue", { size })}
          </option>
        ))}
      </Select>
      <Checkbox
        id="bb-editor-auto-close"
        label={t("autoClose")}
        checked={settings.autoClose}
        onChange={(event) => set("autoClose", event.target.checked)}
      />
      <Checkbox
        id="bb-editor-list-continue"
        label={t("listContinue")}
        checked={settings.listContinue}
        onChange={(event) => set("listContinue", event.target.checked)}
      />
      <p className={textClasses({ tone: "muted", size: "xs" })}>{t("saved")}</p>
    </Surface>
  );
}
