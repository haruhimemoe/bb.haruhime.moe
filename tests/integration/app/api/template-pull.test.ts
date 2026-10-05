/**
 * @file tests/integration/app/api/template-pull.test.ts
 * @desc POST /api/templates/<id>/pull: the fork's owner only, signed in, from this site; 404 for
 *       a template that isn't a fork of anything reachable; 200 with the merged template once the
 *       upstream changed.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Oct 5, 2026
 * @modified Mon Oct 5, 2026
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/[id]/pull/route";
import { forkTemplate } from "@/services/templates-create";
import { updateTemplate } from "@/services/templates-update";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

const pull = (cookie: string | null, id: string, headers = {}) =>
  POST(apiRequest("POST", `/api/templates/${id}/pull`, cookie, undefined, headers), params({ id }));

describe("POST /api/templates/<id>/pull", () => {
  it("merges the upstream's change into the caller's fork", async () => {
    const { other, owner } = await createCast();
    const source = await insertTemplate({ name: "Source", body: "old" });
    const forked = await forkTemplate(source._id, {
      osuId: other.osuId,
      username: other.username,
      isAdmin: false,
    });
    if (!forked.ok) throw new Error("fork failed");
    await updateTemplate(
      source._id,
      { osuId: owner.osuId, username: owner.username, isAdmin: false },
      { baseVersion: source.version, body: "new" },
    );
    const response = await pull(other.cookie, forked.value.id);
    expect(response.status).toBe(200);
    const { template } = (await response.json()) as { template: { body: string } };
    expect(template.body).toBe("new");
  });

  it("refuses a visitor, another site, a non-owner, and a template with no reachable upstream", async () => {
    const { other, owner } = await createCast();
    const source = await insertTemplate({ name: "Source" });
    const forked = await forkTemplate(source._id, {
      osuId: other.osuId,
      username: other.username,
      isAdmin: false,
    });
    if (!forked.ok) throw new Error("fork failed");
    expect((await pull(null, forked.value.id)).status).toBe(401);
    expect((await pull(other.cookie, forked.value.id, CROSS_SITE)).status).toBe(403);
    // The fork is private, so another signed-in user can't even see it (404, not 403).
    expect((await pull(owner.cookie, forked.value.id)).status).toBe(404);
    const notAFork = await insertTemplate({ ownerOsuId: other.osuId });
    expect((await pull(other.cookie, notAFork._id)).status).toBe(404);
  });
});
