/**
 * @file src/components/collab/ImagemapImport.tsx
 * @desc Paste an [imagemap] you already have to edit it in the collab maker: parsed with
 *       @haruhimemoe/bbcode's parseImagemap, it replaces the image and regions; a block osu!
 *       would refuse lists each problem by line instead.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import type { ImagemapIssue } from "@haruhimemoe/bbcode/imagemap";
import { Button, Disclosure, Notice, Textarea } from "@haruhimemoe/ui";
import { useState } from "react";
import { type CollabState, importImagemap } from "@/utils/collab";

type ImagemapImportProps = {
  newId: () => string;
  onLoad: (state: CollabState) => void;
};

/**
 * @function ImagemapImport
 * @param props {ImagemapImportProps} an id maker and what to do with the loaded state
 * @returns {JSX.Element} a disclosure holding the paste box, its button and any problems
 */
export function ImagemapImport({ newId, onLoad }: ImagemapImportProps) {
  const [text, setText] = useState("");
  const [issues, setIssues] = useState<ImagemapIssue[]>([]);
  const load = () => {
    const result = importImagemap(text, newId);
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    setIssues([]);
    setText("");
    onLoad(result.state);
  };
  return (
    <Disclosure
      summary="Edit an imagemap you already have"
      panelClassName="flex flex-col gap-2 pt-2"
    >
      <Textarea
        id="collab-import"
        label="Paste the whole [imagemap] block"
        value={text}
        rows={5}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="font-mono text-sm"
      />
      <div>
        <Button variant="secondary" disabled={text.trim() === ""} onClick={load}>
          Edit this imagemap
        </Button>
      </div>
      {issues.length > 0 ? (
        <Notice tone="warning" as="div">
          <p>osu! wouldn't accept this imagemap:</p>
          <ul className="list-disc pl-5">
            {issues.map((issue) => (
              <li key={`${issue.start}-${issue.message}`}>
                Line {issue.line}: {issue.message}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}
    </Disclosure>
  );
}
