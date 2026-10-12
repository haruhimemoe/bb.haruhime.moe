/**
 * @file src/components/editor/VariablesTool.tsx
 * @desc The toolbar's Variables tool: a field for each `{{key}}` in the draft (src/utils/
 *       variables.ts). The values are kept with the draft and used by the preview, the count and
 *       Copy; Fill in writes them into the text in place of their keys (one undo step).
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Surface, Text, TextInput, textClasses } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { VAR_VALUE_MAX } from "@/constants/editor";
import { replaceAll, type TextEdit } from "@/utils/text-edit";
import { type DraftVars, fillVariables } from "@/utils/variables";

type VariablesToolProps = {
  /** The keys the draft uses. */
  keys: readonly string[];
  /** The values set so far. */
  vars: DraftVars;
  onVars: (vars: DraftVars) => void;
  onEdit: (edit: TextEdit) => void;
  /** The whole text, read by Fill in. */
  document: () => string;
};

/**
 * @function VariablesTool
 * @param props {VariablesToolProps} the keys, their values and the handlers
 * @returns {JSX.Element} a field per key and Fill in, or how to start
 */
export function VariablesTool({ keys, vars, onVars, onEdit, document }: VariablesToolProps) {
  const t = useTranslations("bb.variables");
  return (
    <Surface as="section" aria-label={t("label")} className="flex flex-col gap-3">
      {keys.length === 0 ? (
        <Text tone="muted">{t("none")}</Text>
      ) : (
        <>
          <Text tone="muted">{t("lead")}</Text>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keys.map((key) => (
              <TextInput
                key={key}
                id={`bb-var-${key}`}
                label={key}
                value={Object.hasOwn(vars, key) ? vars[key] : ""}
                maxLength={VAR_VALUE_MAX}
                onChange={(event) => onVars({ ...vars, [key]: event.target.value })}
                autoComplete="off"
              />
            ))}
          </div>
          <p className={textClasses({ tone: "muted", size: "xs" })}>{t("emptyHint")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => onEdit(replaceAll(fillVariables(document(), vars)))}
            >
              {t("fill")}
            </Button>
            <p className={textClasses({ tone: "muted", size: "xs" })}>{t("fillHint")}</p>
          </div>
        </>
      )}
    </Surface>
  );
}
