import { test } from "node:test";
import assert from "node:assert/strict";
import { mapMaw, mapHerdr, normalizeStatus, localServiceUrl, previewFleet, projectFromPath } from "../lib/fleet.ts";
import { readFleet } from "../lib/fleet-server.ts";

const maw = { node: "m5", agents: [
  { id: "%7", target: "glyph:0.0", title: "Codex", command: "codex", cwd: "/work/glyph-oracle", node: "m5" },
  { id: "%8", target: "arra:1.0", title: "Arra", command: "claude", cwd: "/work/arra-oracle" },
] };
const sessions = [{ name: "glyph", windows: [{ index: 0, name: "glyph-oracle", status: "working" }] }];
const herdr = [{ name: "bWFpbg/dzE", source: "local", windows: [
  { index: 10, name: "neo-oracle", agent: "codex", status: "blocked", cwd: "/work/neo-oracle" },
  { index: 11, name: "shell", agent: "", status: "idle" },
  { index: 12, name: "athena", agent: "claude", status: "done" },
] }];
const configs = [
  { id: "maw", name: "maw serve", url: "http://127.0.0.1:3456", token: "test-secret" },
  { id: "herdr", name: "maw herdr serve", url: "http://127.0.0.1:3457", token: "test-other" },
];

test("MAW maps actual envelope + session status without guessing unknown lifecycle", () => {
  const bots = mapMaw(maw, sessions, configs[0].url, 123);
  assert.equal(bots.length, 2);
  assert.equal(bots[0].name, "glyph-oracle");
  assert.equal(bots[0].status, "working");
  assert.equal(bots[0].project, "glyph-oracle");
  assert.equal(bots[1].status, "unknown");
  assert.equal(bots[1].working, false);
  assert.equal(bots[0].seenAt, 123);
  assert.equal(mapMaw(maw.agents, [], configs[0].url, 123).length, 2);
});

test("Herdr preserves blocked/done, excludes shells, and uses decimal HTTP pane identifiers", () => {
  const bots = mapHerdr(herdr, configs[1].url, 123);
  assert.equal(bots.length, 2);
  assert.equal(bots[0].status, "blocked");
  assert.equal(bots[0].pane, "bWFpbg/dzE:10");
  assert.equal(bots[1].status, "done");
  assert.notEqual(bots[0].id, bots[1].id);
});

test("no status inferred from arbitrary text or output", () => {
  assert.equal(normalizeStatus("idle"), "idle");
  assert.equal(normalizeStatus("waiting_input"), "blocked");
  for (const status of [undefined, "online", "codex", "recent output", "", "failed"]) assert.equal(normalizeStatus(status), "unknown");
});

test("service URLs are loopback-only, credential-free and not redirects/proxy paths", () => {
  assert.equal(localServiceUrl("http://127.0.0.1:3456"), "http://127.0.0.1:3456");
  for (const url of ["https://evil.example", "http://127.0.0.1.evil.example", "file:///etc/passwd", "http://secret@localhost:3456", "http://localhost/api/send", "http://localhost?token=secret"]) {
    assert.throws(() => localServiceUrl(url));
  }
});

test("reader calls only known GET routes, server tokens stay out of returned data", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const payload = url.includes(":3457") ? herdr : url.includes("/api/agents") ? maw : sessions;
    return Response.json(payload);
  };
  const result = await readFleet(configs, fetcher);
  assert.equal(result.bots.length, 4);
  assert.equal(result.readOnly, true);
  assert.ok(result.sources.every(s => s.status === "connected"));
  assert.ok(calls.every(c => c.options.method === "GET" && c.options.redirect === "error"));
  assert.deepEqual(calls.map(c => new URL(c.url).pathname).sort(), ["/api/agents", "/api/sessions", "/api/sessions"]);
  assert.equal(calls[0].options.headers.authorization, "Bearer test-secret");
  assert.ok(!JSON.stringify(result).includes("test-secret"));
});

test("partial failure keeps healthy fleet, exposes authentication without pretending live", async () => {
  const result = await readFleet(configs, async url => url.includes(":3457") ? new Response("unauthorized", { status: 401 }) : Response.json(url.includes("/api/agents") ? maw : sessions));
  assert.equal(result.bots.length, 2);
  assert.equal(result.sources[1].status, "error");
  assert.match(result.sources[1].error, /HERDR_OFFICE_TOKEN/);
  assert.equal(result.sources[1].count, 0);
});

test("valid empty roster differs from unreachable or malformed service", async () => {
  const empty = await readFleet(configs, async url => Response.json(url.includes("/api/agents") ? { agents: [], node: "m5" } : []));
  assert.equal(empty.bots.length, 0);
  assert.ok(empty.sources.every(s => s.status === "connected"));
  const down = await readFleet(configs, async () => { throw new TypeError("fetch failed"); });
  assert.ok(down.sources.every(s => s.status === "offline"));
  const malformed = await readFleet(configs, async () => Response.json({ unexpected: true }));
  assert.ok(malformed.sources.every(s => s.status === "error"));
});

test("preview is standalone, clearly separated, and has no outbound links", () => {
  const preview = previewFleet(123);
  assert.equal(preview.bots.length, 9);
  assert.equal(preview.sources.length, 0);
  assert.ok(preview.bots.every(bot => bot.host === "preview" && bot.href === ""));
});

 test("repository households keep worktrees and nested projects together", () => {
  assert.equal(projectFromPath("/opt/Code/github.com/laris-co/neo-oracle/wt/issue-123/src"), "neo-oracle");
  assert.equal(projectFromPath("/work/arra-oracle"), "arra-oracle");
  assert.equal(projectFromPath(""), "Not reported");
});
