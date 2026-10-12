/**
 * @file src/components/editor/Editor.tsx
 * @desc The editor at /: the drafts bar, the toolbar, the CodeMirror source (loaded in the
 *       browser only, so the page stays static) beside the live preview on wide screens and in
 *       tabs on phones, then what lint finds (with Fix all), the target, counter and Copy. A
 *       template's "Use" arrives as a new draft (useDrafts). Its root widens the page's column.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { cx, EmptyState, Notice, Tabs, tabId, tabPanelId } from "@haruhimemoe/ui";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useDeferredValue, useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { DraftsBar } from "@/components/editor/DraftsBar";
import { PostStatus } from "@/components/editor/PostStatus";
import { ProblemSummary } from "@/components/editor/ProblemSummary";
import type { EditorHandle } from "@/components/editor/SourceEditor";
import { Toolbar } from "@/components/editor/Toolbar";
import type { PostTarget } from "@/constants/editor";
import { useDrafts } from "@/hooks/useDrafts";
import { useEditorSettings } from "@/hooks/useEditorSettings";

const SourceEditor = dynamic(
  () => import("@/components/editor/SourceEditor").then((module) => module.SourceEditor),
  {
    ssr: false,
    loading: () => <EditorLoading />,
  },
);

type Pane = "source" | "preview";

/** The editor's placeholder while CodeMirror loads. */
function EditorLoading() {
  const t = useTranslations("bb.preview");
  return (
    <div className="flex min-h-[24rem] items-center justify-center rounded-md bg-b6 text-c4 text-sm lg:min-h-[36rem]">
      {t("loading")}
    </div>
  );
}

/**
 * @function Editor
 * @returns {JSX.Element} the whole editor
 */
export function Editor() {
  const t = useTranslations("bb.preview");
  const drafts = useDrafts();
  const [settings, setSettings] = useEditorSettings();
  const [handle, setHandle] = useState<EditorHandle | null>(null);
  const [pane, setPane] = useState<Pane>("source");
  const [target, setTarget] = useState<PostTarget>("userpage");
  const text = drafts.active?.text ?? "";
  const preview = useDeferredValue(text);
  const onReady = useCallback((next: EditorHandle | null) => setHandle(next), []);
  const panel = (id: Pane) => ({
    id: tabPanelId("bb-pane", id),
    role: "tabpanel",
    "aria-labelledby": tabId("bb-pane", id),
    className: cx("min-w-0 lg:block", pane === id ? "block" : "hidden"),
  });
  return (
    <div data-bb-wide className="flex flex-col gap-4">
      <DraftsBar drafts={drafts} />
      {drafts.fromTemplate ? (
        <Notice>{t("fromTemplate", { name: drafts.active?.name ?? "" })}</Notice>
      ) : null}
      <Toolbar
        onEdit={(edit) => handle?.apply(edit)}
        selection={() => handle?.selection() ?? ""}
        document={() => handle?.document() ?? text}
        onMarks={(lost) => handle?.markLosses(lost)}
        settings={settings}
        onSettings={setSettings}
        disabled={!handle}
      />
      <Tabs
        label={t("show")}
        idPrefix="bb-pane"
        tabs={[
          { id: "source", label: t("bbcode") },
          { id: "preview", label: t("preview") },
        ]}
        value={pane}
        onChange={setPane}
        className="lg:hidden"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div {...panel("source")}>
          {drafts.active ? (
            <SourceEditor
              key={drafts.active.id}
              value={text}
              onChange={drafts.setText}
              onReady={onReady}
              label={t("bbcode")}
              settings={settings}
            />
          ) : null}
        </div>
        <div {...panel("preview")}>
          {preview.trim() === "" ? (
            <EmptyState variant="filled" className="min-h-[24rem] text-sm lg:min-h-[36rem]">
              {t("empty")}
            </EmptyState>
          ) : (
            <BbPreview
              source={preview}
              target={target}
              className="min-h-[24rem] lg:min-h-[36rem]"
            />
          )}
        </div>
      </div>
      <ProblemSummary
        text={preview}
        onShow={() => handle?.showProblems()}
        onFixAll={() => handle?.fixAll() ?? 0}
      />
      <PostStatus text={text} target={target} onTarget={setTarget} />
    </div>
  );
}
