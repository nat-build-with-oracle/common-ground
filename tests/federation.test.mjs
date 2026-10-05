import { test } from "node:test";
import assert from "node:assert/strict";
import { mapFederation } from "../lib/fleet.ts";
import { readFleet } from "../lib/fleet-server.ts";

const status = {
  node: "m5",
  members: [
    { handle: "neo-oracle", kind: "claude", pane: "w1:p1", status: "working", where: "/opt/Code/github.com/laris-co/neo-oracle" },
    { handle: "zsh", kind: "shell", pane: "w1:p2", status: "idle" },
  ],
  peerMembers: {
    white: [{ handle: "claude", kind: "claude", pane: "w2:p1", status: "blocked", where: "/home/nat/Code/github.com/laris-co/thor-oracle" }],
    mba: [{ handle: "codex", kind: "codex", pane: "w3:p1", status: "working", where: "/Users/nat/Code/github.com/x/atlas-oracle" }],
  },
  peers: [{ name: "white", ok: true }, { name: "mba", ok: false, via: "white" }],
  invite: { secret: "never-read" }, messages: [{ text: "never-read" }],
};
const url = "http://127.0.0.1:6750";

test("federation maps this node and every peer it can see, one district per node", () => {
  const { node, bots } = mapFederation(status, url, 1);
  assert.equal(node, "m5");
  assert.deepEqual(bots.map(bot => [bot.host, bot.name, bot.status]), [["m5", "neo-oracle", "working"], ["white", "thor-oracle", "blocked"], ["mba", "atlas-oracle", "offline"]]);
  assert.ok(bots.every(bot => bot.source === "federation" && bot.sectionId === `federation:${bot.host}`));
  assert.ok(!JSON.stringify(bots).includes("never-read"));
});

test("federation rejects a payload that is not /api/status", () => {
  assert.throws(() => mapFederation({ agents: [] }, url, 1), /Unexpected federation/);
  assert.throws(() => mapFederation({ node: "m5", members: [], peerMembers: [] }, url, 1), /Unexpected federation/);
});

test("local agents come from herdr; federation adds only the other nodes", async () => {
  const herdr = [{ name: "main", windows: [{ index: 1, name: "neo-oracle", agent: "claude", status: "working", cwd: "/w/neo-oracle" }] }];
  const configs = [{ id: "herdr", name: "maw herdr serve", url: "http://127.0.0.1:3457" }, { id: "federation", name: "herdr-federation", url }];
  const both = await readFleet(configs, async u => Response.json(String(u).includes(":6750") ? status : herdr));
  assert.deepEqual(both.bots.map(bot => `${bot.source}:${bot.host}`).sort(), ["federation:mba", "federation:white", "herdr:local"]);
  assert.equal(both.sources.find(s => s.id === "federation").count, 2);
  const fedOnly = await readFleet(configs, async u => String(u).includes(":6750") ? Response.json(status) : new Response("down", { status: 502 }));
  assert.equal(fedOnly.bots.filter(bot => bot.source === "federation").length, 3);
});
