import assert from "node:assert/strict";
const origin = process.argv[2] ?? "http://127.0.0.1:3301";
const request = (path, options = {}) => fetch(origin + path, { signal: AbortSignal.timeout(15000), ...options });
const response = await request("/api/fleet");
assert.equal(response.status, 200);
assert.equal(response.headers.get("cache-control"), "no-store");
const snapshot = await response.json();
assert.equal(snapshot.readOnly, true);
assert.deepEqual(snapshot.sources.map(s => s.id), ["maw", "herdr", "federation"]);
assert.ok(Array.isArray(snapshot.nodes ?? []), "federation machines, when present, are a list");
for (const source of snapshot.sources) assert.ok(["connected", "offline", "error"].includes(source.status));
console.log("PASS fleet GET reports explicit per-service connectivity");
assert.equal((await request("/api/fleet", { method: "POST" })).status, 405);
assert.equal((await request("/api/send", { method: "POST" })).status, 404);
assert.equal((await request("/api/events")).status, 404);
assert.equal((await request("/api/fleet", { headers: { origin: "https://evil.example" } })).status, 403);
assert.equal((await request("/api/fleet", { headers: { "sec-fetch-site": "cross-site" } })).status, 403);
console.log("PASS command routes absent; POST and cross-site reads rejected");
console.log(JSON.stringify(snapshot.sources.map(({ name, status, count }) => ({ name, status, count }))));

assert.equal((await request("/api/terminal", {method:"POST"})).status,405);
assert.equal((await request("/api/terminal?id=anything", {headers:{origin:"https://evil.example"}})).status,403);
assert.equal((await request("/api/terminal?id=anything", {headers:{"sec-fetch-site":"cross-site"}})).status,403);
assert.equal((await request("/api/terminal?target=arbitrary")).status,400);
assert.equal((await request("/api/terminal?id=a&id=b&id=c&id=d&id=e")).status,400);
const missing = await (await request("/api/terminal?id=unknown-agent")).json();
assert.equal(missing.snapshots[0].status,"unavailable");
if(snapshot.bots.length) {
 const captures=await (await request("/api/terminal?"+new URLSearchParams({id:snapshot.bots[0].id}))).json();
 assert.equal(captures.readOnly,true);assert.equal(captures.snapshots[0].botId,snapshot.bots[0].id);
 console.log("Terminal source:",captures.snapshots[0].status,"characters:",captures.snapshots[0].content.length);
}
console.log("PASS terminal GET is bounded, same-origin, read-only and roster-allowlisted");

assert.equal((await request("/api/terminal/full", {method:"POST"})).status,405);
assert.equal((await request("/api/terminal/full?id=anything", {headers:{origin:"https://evil.example"}})).status,403);
assert.equal((await request("/api/terminal/full?id=anything", {headers:{"sec-fetch-site":"cross-site"}})).status,403);
assert.equal((await request("/api/terminal/full?id=a&id=b")).status,400);
assert.equal((await request("/api/terminal/full?target=arbitrary")).status,400);
assert.equal((await (await request("/api/terminal/full?id=unknown-agent")).json()).status,"unavailable");
const live = snapshot.bots.find(bot => bot.status !== "offline");
if(live) {
 const full=await (await request("/api/terminal/full?"+new URLSearchParams({id:live.id}))).json();
 assert.equal(full.readOnly,true);assert.equal(full.botId,live.id);assert.ok(full.text.length <= 300 * 401);
 console.log("Full terminal source:",live.source,full.status,"lines:",full.text ? full.text.split("\n").length : 0);
}
console.log("PASS full-screen terminal GET: one roster id, same-origin, read-only, bounded");

// Catch a deployed markup/styles mismatch before it can turn an unbounded SVG
// into a full-screen crest again. This verifies the actual served CSS, not only source.
const page = await request('/');
assert.equal(page.status, 200);
const html = await page.text();
const cssPaths = [...html.matchAll(/href="([^\"]+\.css[^\"]*)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
assert.ok(cssPaths.length, 'page includes a stylesheet');
const styles = await Promise.all(cssPaths.map(async path => {
  assert.ok(path.startsWith('/_next/'), 'only bundled local styles');
  const response = await request(path);
  assert.equal(response.status, 200);
  return response.text();
}));
const css = styles.join('\n');
assert.match(css, /\.town-crest\s*\{[^}]*max-width:\s*56px/);
for (const selector of ['town-masthead', 'field-book', 'field-tools', 'travel-deck', 'term-popup', 'palette', 'cabinet-row']) assert.ok(css.includes(`.${selector}`));
console.log('PASS served HUD stylesheet contains bounded crest and the matching field-atlas layout');

// Session deep links are plain page GETs: same shell for any id, no data and no upstream selection.
for (const path of ['/s/herdr%3Alocal%3AZGVmYXVsdA%2Fd0Q%3A34', '/s/unknown']) assert.equal((await request(path)).status, 200);
console.log('PASS /s/<id> serves the town for encoded and unknown ids');
