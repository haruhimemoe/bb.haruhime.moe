/**
 * @file tests/integration/app/api/template-proposals.test.ts
 * @desc The proposal routes: proposing from one's own fork (signed in, from this site), the
 *       upstream owner's list, merge and decline, and the proposer's withdraw; who else gets
 *       401, 403 or 404.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { describe, expect, it } from "vitest";
import { POST as decline } from "@/app/api/templates/[id]/proposals/[pid]/decline/route";
import { POST as merge } from "@/app/api/templates/[id]/proposals/[pid]/merge/route";
import { DELETE as withdraw } from "@/app/api/templates/[id]/proposals/[pid]/route";
import { GET as list } from "@/app/api/templates/[id]/proposals/route";
import { POST as propose } from "@/app/api/templates/[id]/propose/route";
import { forkTemplate } from "@/services/templates-create";
import { updateTemplate } from "@/services/templates-update";
import { setupTestDb } from "../../../helpers/db";
import { apiRequest, CROSS_SITE, createCast, params } from "../../../helpers/requests";
import { insertTemplate } from "../../../helpers/templates";

setupTestDb();

/** The cast, a source the owner has, and the other user's fork of it with a changed line. */
const setup = async () => {
  const cast = await createCast();
  const source = await insertTemplate({ name: "Source", body: "a\nb\nc\nd" });
  const other = { osuId: cast.other.osuId, username: cast.other.username, isAdmin: false };
  const forked = await forkTemplate(source._id, other);
  if (!forked.ok) throw new Error("fork failed");
  await updateTemplate(forked.value.id, other, {
    baseVersion: forked.value.version,
    body: "a\nB\nc\nd",
  });
  return { ...cast, source, forkId: forked.value.id };
};

const proposeAs = (cookie: string | null, forkId: string, headers = {}) =>
  propose(
    apiRequest("POST", `/api/templates/${forkId}/propose`, cookie, { message: "B" }, headers),
    params({ id: forkId }),
  );

const proposalId = async (response: Response) =>
  ((await response.json()) as { proposal: { id: string } }).proposal.id;

describe("the proposal routes", () => {
  it("propose, list and merge, end to end", async () => {
    const { owner, other, source, forkId } = await setup();
    const proposed = await proposeAs(other.cookie, forkId);
    expect(proposed.status).toBe(200);
    const pid = await proposalId(proposed);
    const listed = await list(
      apiRequest("GET", `/api/templates/${source._id}/proposals`, owner.cookie),
      params({ id: source._id }),
    );
    expect(listed.status).toBe(200);
    const { proposals } = (await listed.json()) as { proposals: { id: string }[] };
    expect(proposals.map((one) => one.id)).toEqual([pid]);
    const merged = await merge(
      apiRequest("POST", `/api/templates/${source._id}/proposals/${pid}/merge`, owner.cookie),
      params({ id: source._id, pid }),
    );
    expect(merged.status).toBe(200);
    const { template } = (await merged.json()) as { template: { body: string } };
    expect(template.body).toBe("a\nB\nc\nd");
  });

  it("refuses visitors, other sites and people it isn't theirs to act on", async () => {
    const { owner, other, admin, source, forkId } = await setup();
    expect((await proposeAs(null, forkId)).status).toBe(401);
    expect((await proposeAs(other.cookie, forkId, CROSS_SITE)).status).toBe(403);
    expect((await proposeAs(owner.cookie, forkId)).status).toBe(404);
    const pid = await proposalId(await proposeAs(other.cookie, forkId));
    const listAs = (cookie: string | null) =>
      list(
        apiRequest("GET", `/api/templates/${source._id}/proposals`, cookie),
        params({ id: source._id }),
      );
    expect((await listAs(null)).status).toBe(401);
    expect((await listAs(other.cookie)).status).toBe(403);
    expect((await listAs(admin.cookie)).status).toBe(403);
    const at = `/api/templates/${source._id}/proposals/${pid}`;
    const ids = params({ id: source._id, pid });
    expect((await merge(apiRequest("POST", `${at}/merge`, other.cookie), ids)).status).toBe(403);
    expect((await decline(apiRequest("POST", `${at}/decline`, null), ids)).status).toBe(401);
    expect((await decline(apiRequest("POST", `${at}/decline`, other.cookie), ids)).status).toBe(
      403,
    );
    expect((await withdraw(apiRequest("DELETE", at, owner.cookie), ids)).status).toBe(403);
    expect((await withdraw(apiRequest("DELETE", at, other.cookie), ids)).status).toBe(204);
    expect((await withdraw(apiRequest("DELETE", at, other.cookie), ids)).status).toBe(404);
  });

  it("lets the owner decline", async () => {
    const { owner, other, source, forkId } = await setup();
    const pid = await proposalId(await proposeAs(other.cookie, forkId));
    const at = `/api/templates/${source._id}/proposals/${pid}/decline`;
    const response = await decline(
      apiRequest("POST", at, owner.cookie),
      params({ id: source._id, pid }),
    );
    expect(response.status).toBe(204);
  });
});
