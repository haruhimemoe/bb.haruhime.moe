/**
 * @file tests/unit/utils/profile-ref.test.ts
 * @desc Finding the [profile] pair under the mouse: the id wins over the name, anywhere in the
 *       pair counts, outside it doesn't, and two on one line each answer for their own range.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { profileAt } from "@/utils/profile-ref";

describe("profileAt", () => {
  it("reads the name between the tags", () => {
    expect(profileAt("hi [profile]peppy[/profile]!", 14)).toEqual({
      from: 3,
      to: 27,
      query: "peppy",
    });
  });

  it("prefers the id in the opening tag", () => {
    expect(profileAt("[profile=2]the boss[/profile]", 0)?.query).toBe("2");
  });

  it("counts both tags as part of the pair", () => {
    expect(profileAt("[profile]a b[/profile]", 1)?.query).toBe("a b");
    expect(profileAt("[profile]a b[/profile]", 21)?.query).toBe("a b");
  });

  it("answers for the pair under the column only", () => {
    const line = "[profile]one[/profile] and [profile]two[/profile]";
    expect(profileAt(line, 5)?.query).toBe("one");
    expect(profileAt(line, 24)).toBeNull();
    expect(profileAt(line, 40)?.query).toBe("two");
  });

  it("skips empty and unclosed pairs", () => {
    expect(profileAt("[profile][/profile]", 3)).toBeNull();
    expect(profileAt("[profile]peppy", 3)).toBeNull();
  });
});
