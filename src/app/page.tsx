/**
 * @file src/app/page.tsx
 * @desc The editor: an osu! BBCode source and its preview, drafts kept in this browser.
 *       Static; the editor itself loads in the browser.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { PageHeader } from "@haruhimemoe/ui";
import { Editor } from "@/components/editor/Editor";

/**
 * @function EditorPage
 * @returns {JSX.Element} the page title and the editor
 */
export default function EditorPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="osu! BBCode editor"
        lead="Write a userpage, forum post or beatmap description and see it as you type. Your drafts stay in this browser; nothing is sent anywhere."
      />
      <Editor />
    </div>
  );
}
