/**
 * @file tests/unit/utils/template-draft.test.ts
 * @desc The template form's working copy: a stored template's values, blank fields and their
 *       keys and labels, and an edit's body with only what changed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { describe, expect, it } from "vitest";
import {
  blankField,
  draftOf,
  EMPTY_DRAFT,
  labelFromKey,
  nextFieldKey,
  patchOf,
} from "@/utils/template-draft";
import { toTemplateView } from "@/utils/template-view";
import { makeTemplate } from "../../helpers/templates";

describe("template drafts", () => {
  it("labels a field from its key", () => {
    expect(labelFromKey("team_name")).toBe("Team name");
    expect(labelFromKey("rankRange")).toBe("Rank range");
    expect(blankField("_")).toMatchObject({ key: "_", label: "_", kind: "text", required: false });
  });

  it("picks the next free field key", () => {
    expect(nextFieldKey([])).toBe("field1");
    expect(nextFieldKey([blankField("field2")])).toBe("field3");
    expect(nextFieldKey([blankField("a"), blankField("field3"), blankField("field4")])).toBe(
      "field5",
    );
  });

  it("sends only what changed, with the version", () => {
    const saved = toTemplateView(makeTemplate({ version: 4, fields: [blankField("a")] }));
    const draft = draftOf(saved);
    expect(patchOf(saved, draft)).toEqual({ baseVersion: 4 });
    draft.fields[0] = { ...blankField("a"), required: true };
    expect(patchOf(saved, { ...draft, name: "New" })).toEqual({
      baseVersion: 4,
      name: "New",
      fields: [{ ...blankField("a"), required: true }],
    });
    expect(saved.fields[0]?.required).toBe(false);
  });

  it("starts a new template private and empty", () => {
    expect(EMPTY_DRAFT).toMatchObject({ visibility: "private", body: "", fields: [] });
  });
});
