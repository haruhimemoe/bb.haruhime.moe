/**
 * @file src/components/collab/CollabOutput.tsx
 * @desc The collab maker's result: the [imagemap] block (read-only), Copy, "Open in the editor"
 *       (a new draft, through the editor's hand-off) and the live preview from the package
 *       renderer. Until the imagemap is valid it lists what's missing instead.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, CopyButton, Notice, Textarea } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BbPreview } from "@/components/editor/BbPreview";
import { HANDOFF_KEY } from "@/constants/editor";
import type { CollabOutput as Output } from "@/utils/collab";
import { writeStored } from "@/utils/storage";

type CollabOutputProps = {
  output: Output;
};

/**
 * @function CollabOutput
 * @param props {CollabOutputProps} collabOutput's answer
 * @returns {JSX.Element} the code, its buttons and the preview, or what's missing
 */
export function CollabOutput({ output }: CollabOutputProps) {
  const t = useTranslations("bb.collab");
  const ui = useTranslations("ui");
  const router = useRouter();
  const { bbcode, problems } = output;
  if (bbcode === null) {
    const general = problems.filter((problem) => !/^regions\.\d/.test(problem.field));
    return (
      <Notice as="div">
        <p className="font-bold">{t("notReady")}</p>
        <ul className="list-disc pl-5">
          {general.map((problem) => (
            <li key={problem.field}>{problem.message}</li>
          ))}
          {general.length < problems.length ? <li>{t("fixRegions")}</li> : null}
        </ul>
      </Notice>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2">
        <Textarea
          id="collab-output"
          label={t("output")}
          value={bbcode}
          readOnly
          rows={Math.min(14, bbcode.split("\n").length + 1)}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={bbcode}
            label={t("copy")}
            copiedMessage={ui("actions.copiedDot")}
            failedMessage={ui("actions.copyFailedLong")}
          />
          <Button
            variant="ghost"
            onClick={() => {
              if (writeStored(HANDOFF_KEY, bbcode)) router.push("/");
            }}
          >
            {t("open")}
          </Button>
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-1 font-bold text-c2 text-sm">{t("preview")}</p>
        <BbPreview source={bbcode} />
      </div>
    </div>
  );
}
