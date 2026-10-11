/**
 * @file tests/unit/utils/import-ref.test.ts
 * @desc What the Import tool accepts: forum topic and post links (new and old), profile links by
 *       id or name, @id, bare usernames (spaces and brackets too), and everything else refused.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { parseImportRef } from "@/utils/import-ref";

describe("parseImportRef", () => {
  it.each([
    ["https://osu.ppy.sh/community/forums/topics/123", { kind: "topic", topicId: 123 }],
    ["  https://osu.ppy.sh/community/forums/topics/123/  ", { kind: "topic", topicId: 123 }],
    [
      "https://osu.ppy.sh/community/forums/topics/123?start=456",
      { kind: "post", topicId: 123, postId: 456 },
    ],
    ["https://osu.ppy.sh/community/forums/posts/456", { kind: "post-only", postId: 456 }],
    ["https://old.ppy.sh/forum/t/123", { kind: "topic", topicId: 123 }],
    ["https://old.ppy.sh/forum/p/456", { kind: "post-only", postId: 456 }],
    ["https://osu.ppy.sh/users/2", { kind: "user", user: 2 }],
    ["https://osu.ppy.sh/users/2/osu", { kind: "user", user: 2 }],
    ["https://osu.ppy.sh/users/2/mania/", { kind: "user", user: 2 }],
    ["https://osu.ppy.sh/u/peppy", { kind: "user", user: "peppy" }],
    ["https://osu.ppy.sh/users/-Hid-%20%5BCookie%5D", { kind: "user", user: "-Hid- [Cookie]" }],
    ["@2", { kind: "user", user: 2 }],
    ["peppy", { kind: "user", user: "peppy" }],
    ["-Hid- [Cookie]", { kind: "user", user: "-Hid- [Cookie]" }],
    ["123", { kind: "user", user: "123" }],
  ])("%s", (input, expected) => {
    expect(parseImportRef(input)).toEqual(expected);
  });

  it.each([
    "",
    "ab",
    "sixteen_chars_xx",
    "bad!name",
    "@0",
    "@-1",
    "@99999999999999999999",
    "https://example.com/community/forums/topics/1",
    "https://osu.ppy.sh/beatmapsets/1",
    "https://osu.ppy.sh/users/",
    "https://osu.ppy.sh/users/0",
    "https://osu.ppy.sh/users/%E0%A4%A",
    "https://osu.ppy.sh/users/2/catch",
    "https://osu.ppy.sh/community/forums/topics/0",
    "javascript:alert(1)",
  ])("refuses %j", (input) => {
    expect(parseImportRef(input)).toEqual({ kind: "invalid" });
  });
});
