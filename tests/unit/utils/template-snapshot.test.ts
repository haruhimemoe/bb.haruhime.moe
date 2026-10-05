/**
 * @file tests/unit/utils/template-snapshot.test.ts
 * @desc snapshotOf copies exactly the content keys, TEMPLATE_CODEC keys fields by their key and
 *       merges the body line by line, and forkRefOf reads every forkOf shape a row can hold.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { diffValue, mergeValue } from "@haruhimemoe/vcs/json";
import { describe, expect, it } from "vitest";
import { forkRefOf, snapshotOf, TEMPLATE_CODEC } from "@/utils/template-snapshot";

const content = {
  name: "My userpage",
  description: "A short one.",
  kind: "userpage" as const,
  body: "line one\nline two\nline three",
  fields: [{ key: "name", label: "Name", kind: "text" as const, required: true, default: "" }],
};

describe("snapshotOf", () => {
  it("copies exactly the five content keys", () => {
    expect(snapshotOf(content)).toEqual(content);
  });

  it("copies fields, not a reference", () => {
    const snap = snapshotOf(content);
    const [field] = snap.fields;
    if (field) field.label = "Changed";
    expect(content.fields[0]?.label).toBe("Name");
  });
});

describe("TEMPLATE_CODEC", () => {
  it("reads a field rename by key as a set under fields[<key>]", () => {
    const [field] = content.fields;
    const after = { ...content, fields: field ? [{ ...field, label: "New name" }] : [] };
    const changes = diffValue(content, after, TEMPLATE_CODEC);
    expect(changes).toContainEqual(
      expect.objectContaining({ op: "set", path: "fields[name].label", to: "New name" }),
    );
  });

  it("merges two body edits on far-apart lines cleanly", () => {
    const ours = { ...content, body: "line one EDITED\nline two\nline three" };
    const theirs = { ...content, body: "line one\nline two\nline three EDITED" };
    const merge = mergeValue(content, ours, theirs, TEMPLATE_CODEC);
    expect(merge.clean).toBe(true);
    expect(merge.value.body).toBe("line one EDITED\nline two\nline three EDITED");
  });

  it("conflicts when both sides edit the same line", () => {
    const ours = { ...content, body: "line one OURS\nline two\nline three" };
    const theirs = { ...content, body: "line one THEIRS\nline two\nline three" };
    const merge = mergeValue(content, ours, theirs, TEMPLATE_CODEC);
    expect(merge.clean).toBe(false);
    expect(merge.conflicts[0]?.kind).toBe("text");
  });
});

describe("forkRefOf", () => {
  it("reads a bare id as a ref with no known revision", () => {
    expect(forkRefOf("t-abc")).toEqual({ docId: "t-abc", rev: null });
  });

  it("reads null as null", () => {
    expect(forkRefOf(null)).toBeNull();
  });

  it("passes an object ref through", () => {
    const ref = { docId: "t-abc", rev: "r1" };
    expect(forkRefOf(ref)).toEqual(ref);
  });
});
