/**
 * @file src/components/editor/DraftsBar.tsx
 * @desc The editor's drafts: a menu to switch between them, New, Rename (an inline name field)
 *       and Delete (confirmed in place), and whether this browser is saving them.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, InlineConfirm, Select, TextInput } from "@haruhimemoe/ui";
import { useState } from "react";
import { DRAFT_NAME_MAX } from "@/constants/editor";
import type { DraftsState } from "@/hooks/useDrafts";

type DraftsBarProps = {
  drafts: DraftsState;
};

/**
 * @function DraftsBar
 * @param props {DraftsBarProps} the drafts and their actions (from useDrafts)
 * @returns {JSX.Element} the draft menu, its buttons and the save state
 */
export function DraftsBar({ drafts }: DraftsBarProps) {
  const { store, active, saved } = drafts;
  const [renaming, setRenaming] = useState<string | null>(null);
  if (!store || !active) return <p className="text-c4 text-sm">Opening your drafts...</p>;
  const saveName = () => {
    if (renaming !== null) drafts.rename(active.id, renaming);
    setRenaming(null);
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      {renaming === null ? (
        <Select
          id="bb-draft"
          label="Draft"
          value={active.id}
          onChange={(event) => drafts.select(event.target.value)}
          wrapperClassName="min-w-48"
        >
          {store.drafts.map((draft) => (
            <option key={draft.id} value={draft.id}>
              {draft.name}
            </option>
          ))}
        </Select>
      ) : (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveName();
          }}
        >
          <TextInput
            id="bb-draft-name"
            label="Draft name"
            value={renaming}
            maxLength={DRAFT_NAME_MAX}
            onChange={(event) => setRenaming(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRenaming(null);
            }}
            autoFocus
          />
          <Button type="submit">Save name</Button>
        </form>
      )}
      <Button variant="secondary" onClick={drafts.create}>
        New draft
      </Button>
      {renaming === null ? (
        <Button variant="secondary" onClick={() => setRenaming(active.name)}>
          Rename
        </Button>
      ) : null}
      <InlineConfirm
        trigger="Delete"
        question={`Delete "${active.name}"?`}
        confirmLabel="Delete draft"
        onConfirm={() => drafts.remove(active.id)}
      />
      <p className="ml-auto self-center text-c4 text-xs" role="status">
        {saved ? "Drafts are saved in this browser." : "This browser isn't saving drafts."}
      </p>
    </div>
  );
}
