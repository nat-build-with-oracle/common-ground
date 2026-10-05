import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionPath, parseSessionPath, resolveSession } from '../lib/session-url.ts';
import { readTerminal } from '../lib/terminal-server.ts';
import { mapHerdr, fleetSnapshot } from '../lib/fleet.ts';
const config = [{id:'herdr',name:'Herdr',url:'http://127.0.0.1:3457',token:'server-secret'}];
// the real shape: base64url session name containing '/', pane index after ':'
const bots = mapHerdr([{name:'ZGVmYXVsdA/d0Q',windows:[{index:34,name:'codex',agent:'codex',cwd:'/work/arra-oracle',status:'working'},{index:35,name:'claude',agent:'claude',cwd:'/work/neo',status:'idle'}]}], config[0].url, 1);
const fleet = fleetSnapshot(bots,[{id:'herdr',status:'connected'}],1);
const id = bots[0].id;

test('ids containing ":" and "/" encode into exactly one path segment and round-trip', () => {
  assert.equal(id, 'herdr:local:ZGVmYXVsdA/d0Q:34');
  const path = sessionPath(id);
  assert.equal(path, '/s/herdr%3Alocal%3AZGVmYXVsdA%2Fd0Q%3A34');
  assert.equal(path.slice(3).includes('/'), false);
  assert.deepEqual(parseSessionPath(path), { kind: 'id', id });
  assert.deepEqual(parseSessionPath(path + '/'), { kind: 'id', id });
  assert.deepEqual(parseSessionPath('/s/herdr:local:ZGVmYXVsdA/d0Q:34'), { kind: 'id', id }); // unencoded slash from a hand-typed link
  for (const odd of ['a b', 'ไทย', '100%', '?x=1#y', '../..']) assert.deepEqual(parseSessionPath(sessionPath(odd)), { kind: 'id', id: odd });
});

test('non-session and malformed paths never yield an id', () => {
  assert.deepEqual(parseSessionPath('/'), { kind: 'none' });
  assert.deepEqual(parseSessionPath('/api/fleet'), { kind: 'none' });
  for (const bad of ['/s/', '/s//', '/s/%E0%A4%A', '/s/' + 'x'.repeat(501)]) assert.deepEqual(parseSessionPath(bad), { kind: 'invalid' }, bad);
});

test('lookup is against the roster: live, offline and unknown panes', () => {
  assert.equal(resolveSession(id, bots).kind, 'live');
  assert.equal(resolveSession(id, bots).bot.pane, 'ZGVmYXVsdA/d0Q:34');
  assert.equal(resolveSession(bots[1].id, bots).bot.id, bots[1].id);
  assert.equal(resolveSession(id, bots.map(bot => ({ ...bot, status: 'offline' }))).kind, 'offline');
  assert.equal(resolveSession('herdr:local:nope:1', bots).kind, 'missing');
  assert.equal(resolveSession('http://evil.example/api/send', bots).kind, 'missing');
  assert.equal(resolveSession(id, []).kind, 'missing');
});

test('a decoded URL id reaches the same read-only capture path and nothing client-supplied', async () => {
  const parsed = parseSessionPath(sessionPath(id));
  let called = 0;
  const result = await readTerminal(parsed.id, fleet, config, async (url, options) => {
    called++; const u = new URL(url);
    assert.equal(u.origin, config[0].url); assert.equal(u.pathname, '/api/capture');
    assert.equal(u.searchParams.get('target'), 'ZGVmYXVsdA/d0Q:34'); assert.equal(options.method, 'GET');
    return Response.json({ content: 'ok' });
  });
  assert.equal(called, 1); assert.equal(result.status, 'live');
  const none = async () => { throw new Error('must not fetch'); };
  for (const path of ['/s/http%3A%2F%2Fevil%2Fapi%2Fsend', '/s/unknown']) {
    const route = parseSessionPath(path);
    assert.equal((await readTerminal(route.id, fleet, config, none)).status, 'unavailable');
  }
});
