/**
 * @file src/components/editor/Editor.tsx
 * @desc The editor at /: the drafts bar, the toolbar, the CodeMirror source (loaded in the
 *       browser only, so the page stays static) beside the live preview on wide screens and in
 *       tabs on phones, then the target, counter and Copy. A template's "Use" arrives as a new
 *       draft (useDrafts).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { cx, Notice, Tabs, tabId, tabPanelId } from "@haruhimemoe/ui";
import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { DraftsBar } from "@/components/editor/DraftsBar";
import { PostStatus } from "@/components/editor/PostStatus";
import type { EditorHandle } from "@/components/editor/SourceEditor";
import { Toolbar } from "@/components/editor/Toolbar";
import type { PostTarget } from "@/constants/editor";
import { useDrafts } from "@/hooks/useDrafts";

const SourceEditor = dynamic(
  () => import("@/components/editor/SourceEditor").then((module) => module.SourceEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[24rem] items-center justify-center rounded-md bg-b6 text-c4 text-sm">
        Loading the editor...
      </div>
    ),
  },
);

type Pane = "source" | "preview";

const PANES: readonly { id: Pane; label: string }[] = [
  { id: "source", label: "BBCode" },
  { id: "preview", label: "Preview" },
];

/**
 * @function Editor
 * @returns {JSX.Element} the whole editor
 */
export function Editor() {
  const drafts = useDrafts();
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
    <div className="flex flex-col gap-4">
      <DraftsBar drafts={drafts} />
      {drafts.fromTemplate ? (
        <Notice>The template's text is open as a new draft, "{drafts.active?.name}".</Notice>
      ) : null}
      <Toolbar
        onEdit={(edit) => handle?.apply(edit)}
        selection={() => handle?.selection() ?? ""}
        disabled={!handle}
      />
      <Tabs
        label="Show"
        idPrefix="bb-pane"
        tabs={PANES}
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
              label="BBCode"
            />
          ) : null}
        </div>
        <div {...panel("preview")}>
          {preview.trim() === "" ? (
            <p className="flex min-h-[24rem] items-center justify-center rounded-md bg-b4 p-6 text-center text-c3 text-sm">
              The preview shows here as you type. New to osu! BBCode? The docs have every tag.
            </p>
          ) : (
            <BbPreview source={preview} className="min-h-[24rem]" />
          )}
        </div>
      </div>
      <PostStatus text={text} target={target} onTarget={setTarget} />
    </div>
  );
}
