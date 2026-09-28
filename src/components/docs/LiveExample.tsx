/**
 * @file src/components/docs/LiveExample.tsx
 * @desc An editable example in the docs: the BBCode in a text box beside its preview, updated as
 *       it's typed, with Reset and "Open in the editor" (which hands the text over as a new
 *       draft, the way a template's "Use" does). Used by the tag pages and, as <Example>, in the
 *       guides.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, Textarea } from "@haruhimemoe/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { BbPreview } from "@/components/editor/BbPreview";
import { HANDOFF_KEY } from "@/constants/editor";
import { writeStored } from "@/utils/storage";

type LiveExampleProps = {
  /** The example's BBCode. */
  source: string;
  /** What the text box is called (default "Example"). */
  label?: string;
};

/**
 * @function LiveExample
 * @param props {LiveExampleProps} the BBCode and the text box's label
 * @returns {JSX.Element} the editable source, its preview and the buttons
 */
export function LiveExample({ source, label = "Example" }: LiveExampleProps) {
  const id = useId();
  const router = useRouter();
  const [text, setText] = useState(source);
  const rows = Math.min(12, Math.max(3, text.split("\n").length + 1));
  return (
    <div className="not-prose my-4 grid grid-cols-1 gap-3 rounded-md bg-b4 p-3 md:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2">
        <Textarea
          id={`example-${id}`}
          label={`${label} (edit me)`}
          value={text}
          rows={rows}
          spellCheck={false}
          onChange={(event) => setText(event.target.value)}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={text === source} onClick={() => setText(source)}>
            Reset
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (writeStored(HANDOFF_KEY, text)) router.push("/");
            }}
          >
            Open in the editor
          </Button>
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-1 font-bold text-c2 text-sm">Preview</p>
        <BbPreview source={text} className="min-h-0" />
      </div>
    </div>
  );
}
