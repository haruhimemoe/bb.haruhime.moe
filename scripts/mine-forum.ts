/**
 * @file scripts/mine-forum.ts
 * @desc Mines one osu! forum's first posts for the patterns bb learns from (src/utils/
 *       forum-patterns.ts) and writes the counts to content/patterns/forum.json: tag use, tag
 *       pairs, sizes, colors, common box titles, layout shares, and which forum and day. Reads
 *       through the osu! API v2 with the app's credentials, never the website, one call a second;
 *       a topic that fails is skipped. Keeps no post text, names or ids. Run by hand:
 *       `OSU_CLIENT_ID=... OSU_CLIENT_SECRET=... bun scripts/mine-forum.ts --forum 55 --topics 200`.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { writeFileSync } from "node:fs";
import { createOsuClient } from "@haruhimemoe/osu";
import { SERVER_USER_AGENT } from "../src/constants/site";
import { minePatterns } from "../src/utils/forum-patterns";

const OUT = "content/patterns/forum.json";

const option = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(name);
  const value = at < 0 ? fallback : Number(process.argv[at + 1]);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} takes a whole number`);
  return value;
};

const clientId = process.env.OSU_CLIENT_ID ?? "";
const clientSecret = process.env.OSU_CLIENT_SECRET ?? "";
if (!clientId || !clientSecret) {
  console.error("Set OSU_CLIENT_ID and OSU_CLIENT_SECRET (the osu! OAuth app's).");
  process.exit(1);
}
const forumId = option("--forum", 55);
const wanted = option("--topics", 200);
const client = createOsuClient({
  credentials: { clientId, clientSecret },
  userAgent: SERVER_USER_AGENT,
});

/** osu! asks for 60 calls a minute at most: one a second. */
const GAP_MS = 1000;
const pause = () => new Promise((resolve) => setTimeout(resolve, GAP_MS));

const bodies: string[] = [];
let cursor: string | null = null;
let skipped = 0;
while (bodies.length < wanted) {
  const page = await client.listForumTopics({ forumId, sort: "new", limit: 50, cursor });
  await pause();
  for (const topic of page.topics) {
    if (bodies.length >= wanted) break;
    try {
      const first = await client.getForumTopic(topic.id, { sort: "id_asc", limit: 1 });
      const raw = first?.posts[0]?.body?.raw;
      if (raw) bodies.push(raw);
    } catch (error) {
      // One topic osu! won't serve doesn't lose the rest.
      skipped++;
      console.warn(`Skipped topic ${topic.id}:`, error instanceof Error ? error.message : error);
    }
    await pause();
  }
  if (!page.cursor || page.topics.length === 0) break;
  cursor = page.cursor;
}
const patterns = {
  ...minePatterns(bodies),
  source: { forumId, minedOn: new Date().toISOString().slice(0, 10) },
};
writeFileSync(OUT, `${JSON.stringify(patterns, null, 2)}\n`);
console.log(`Mined ${bodies.length} posts from forum ${forumId} into ${OUT} (${skipped} skipped).`);
