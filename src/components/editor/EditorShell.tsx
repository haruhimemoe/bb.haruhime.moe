/**
 * @file src/components/editor/EditorShell.tsx
 * @desc The editor, for now a plain shell: the BBCode source in a textarea beside its preview
 *       (stacked on phones), the character count against osu!'s limit, a copy button, and the
 *       draft kept in this browser (useDraft). A template's "Use" arrives here as the text.
 *       The toolbar, highlighting and lint come with the CodeMirror editor in the next stage.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { CopyButton, Notice, Textarea } from "@haruhimemoe/ui";
import { BbPreview } from "@/components/editor/BbPreview";
import { CharCounter } from "@/components/editor/CharCounter";
import { POST_LIMIT } from "@/constants/editor";
import { useDraft } from "@/hooks/useDraft";
import { countBbcode } from "@/lib/bbcode";

/**
 * @function EditorShell
 * @returns {JSX.Element} the source, the preview, the counter, copy, and the draft state
 */
export function EditorShell() {
  const { text, setText, loaded, saved, fromTemplate } = useDraft();
  return (
    <div className="flex flex-col gap-4">
      {fromTemplate ? (
        <Notice>The template's text is in the editor. It replaced your last draft.</Notice>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          id="bb-source"
          label="BBCode"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!loaded}
          rows={24}
          spellCheck={false}
          className="font-mono text-sm"
          placeholder="[b]Hello[/b], osu!"
        />
        <section aria-labelledby="bb-preview-heading" className="flex flex-col gap-1">
          <h2 id="bb-preview-heading" className="font-bold text-c2 text-sm">
            Preview
          </h2>
          <BbPreview source={text} />
        </section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CharCounter count={countBbcode(text)} limit={POST_LIMIT} />
        <p className="text-c4 text-xs" role="status">
          {saved ? "Your draft is saved in this browser." : "This browser isn't saving drafts."}
        </p>
        <CopyButton text={text} label="Copy BBCode" disabled={text === ""} />
      </div>
    </div>
  );
}
