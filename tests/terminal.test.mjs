import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTerminal, terminalExcerpt } from '../lib/terminal-server.ts';
import { mapHerdr, fleetSnapshot } from '../lib/fleet.ts';
const config = [{id:'herdr',name:'Herdr',url:'http://127.0.0.1:3457',token:'server-secret'}];
const bots = mapHerdr([{name:'session/opaque',windows:[{index:34,name:'codex',agent:'codex',cwd:'/work/arra-oracle',status:'working'}]}], config[0].url, 1);
const fleet = fleetSnapshot(bots,[{id:'herdr',status:'connected'}],1);
test('capture is GET-only, decimal target, configured origin and server-only auth',async()=>{
  let called=0;
  const result=await readTerminal(bots[0].id,fleet,config,async(url,options)=>{
    called++;const u=new URL(url);assert.equal(u.origin,config[0].url);assert.equal(u.pathname,'/api/capture');assert.equal(u.searchParams.get('target'),'session/opaque:34');
    assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.headers.authorization,'Bearer server-secret');return Response.json({content:'\x1b[32mworking\x1b[0m\nnext line'});
  });
  assert.equal(called,1);assert.equal(result.status,'live');assert.equal(result.content,'working\nnext line');assert.ok(!JSON.stringify(result).includes('server-secret'));
  assert.equal(bots[0].name,'arra-oracle');
});
test('unknown agents and offline sources cannot proxy arbitrary captures',async()=>{
  const no=async()=>{throw new Error('must not fetch')};
  assert.equal((await readTerminal('http://evil/api/send',fleet,config,no)).status,'unavailable');
  assert.equal((await readTerminal(bots[0].id,{...fleet,sources:[]},config,no)).status,'unavailable');
});
test('HTTP errors and empty error payloads are not shown as live terminal',async()=>{
  for(const response of [new Response('no',{status:401}),Response.json({content:'',error:'nope'}),Response.json({unexpected:true})]) {
    const result=await readTerminal(bots[0].id,fleet,config,async()=>response);assert.equal(result.status,'unavailable');assert.equal(result.content,'');
  }
});
test('terminal excerpts are bounded, ANSI-free and mask common credentials',()=>{
  const text=terminalExcerpt('old\n'.repeat(40)+'\x1b[31mapi_key=abc123\x1b[0m\nAuthorization: Bearer xyz.secret\n'+'x'.repeat(4000));
  assert.ok(text.length<=1800);assert.ok(text.split('\n').length<=10);assert.ok(!text.includes('\x1b'));assert.ok(!text.includes('abc123'));assert.ok(!text.includes('xyz.secret'));
});

test('full terminal: whole visible screen, redacted, federation panes routed by node, unknown ids refused', async () => {
  const { readFullTerminal, fullScreen } = await import('../lib/terminal-full.ts');
  const screen = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n') + '\nexport API_KEY=abc123secret\n\n\n';
  const text = fullScreen(screen);
  assert.equal(text.split('\n').length, 61);
  assert.match(text, /API_KEY=\[redacted\]/);
  assert.ok(!text.endsWith('\n'));
  const fleet = { bots: [
    { id: 'herdr:local:s:1', source: 'herdr', host: 'local', pane: 's:1' },
    { id: 'federation:white:w2:p1', source: 'federation', host: 'white', pane: 'w2:p1' },
  ], sources: [{ id: 'herdr', status: 'connected' }, { id: 'federation', status: 'connected' }] };
  const configs = [{ id: 'herdr', name: 'h', url: 'http://127.0.0.1:3457', token: 't' }, { id: 'federation', name: 'f', url: 'http://127.0.0.1:6750' }];
  const calls = [];
  const fetcher = async (url, init) => { calls.push([String(url), init.method, init.body]); return Response.json(String(url).includes('/api/fleet/pane') ? { text: 'remote screen' } : { content: 'local screen' }); };
  assert.equal((await readFullTerminal('herdr:local:s:1', fleet, configs, fetcher)).text, 'local screen');
  const remote = await readFullTerminal('federation:white:w2:p1', fleet, configs, fetcher);
  assert.equal(remote.text, 'remote screen');
  assert.deepEqual(JSON.parse(calls[1][2]), { node: 'white', pane: 'w2:p1', lines: 200 });
  assert.equal(calls[1][1], 'POST');
  assert.equal((await readFullTerminal('nope', fleet, configs, fetcher)).status, 'unavailable');
  assert.equal(calls.length, 2, 'an unknown id never reaches a source');
});

test('hosted page: ?host= accepts a bare origin only; browser-side redaction matches the server', async () => {
  const { parseHost } = await import('../lib/hosted.ts');
  assert.deepEqual(parseHost('?host=http://127.0.0.1:3457'), { kind: 'host', origin: 'http://127.0.0.1:3457' });
  assert.deepEqual(parseHost('?host=127.0.0.1:3457'), { kind: 'host', origin: 'http://127.0.0.1:3457' });
  assert.deepEqual(parseHost('?host=https://m5.tail.ts.net'), { kind: 'host', origin: 'https://m5.tail.ts.net' });
  assert.equal(parseHost('').kind, 'none');
  for (const bad of ['?host=http://a@b:1', '?host=http://x:1/api', '?host=javascript:alert(1)', '?host=http://x?y=1']) assert.equal(parseHost(bad).kind, 'invalid', bad);
  const { terminalExcerpt } = await import('../lib/terminal-text.ts');
  assert.equal(terminalExcerpt('\u001b[31mred\u001b[0m\ntoken=abc123\nBearer xyz.123'), 'red\ntoken=[redacted]\nBearer [redacted]');
});

test('the full-screen terminal lives in the URL (t=1) next to ?host=', async () => {
  const { terminalOpen, withTerminal } = await import('../lib/session-url.ts');
  assert.equal(withTerminal('?host=http://127.0.0.1:3457', true), '?host=http%3A%2F%2F127.0.0.1%3A3457&t=1');
  assert.ok(terminalOpen(withTerminal('?host=x', true)));
  assert.equal(withTerminal('?host=x&t=1', false), '?host=x');
  assert.equal(withTerminal('?t=1', false), '');
});

test('walk=1 and t=1 live side by side in the query', async () => {
  const { withFlag, flagOn } = await import('../lib/session-url.ts');
  const both = withFlag(withFlag('?host=x', 't', true), 'walk', true);
  assert.ok(flagOn(both, 't') && flagOn(both, 'walk'));
  assert.equal(withFlag(both, 'walk', false), '?host=x&t=1');
});
