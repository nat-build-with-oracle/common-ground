import { test } from 'node:test';
import assert from 'node:assert/strict';
import { townCounts, filterResidents, nextAttention, hudShortcut } from '../lib/hud.ts';

const bots = ['working', 'idle', 'blocked', 'done', 'unknown', 'offline'].map((status, i) => ({
  id: `b${i}`, name: `Oracle ${i}`, title: 'Codex', status, working: status === 'working',
  project: i === 1 ? 'Arra Atlas' : 'lab', host: 'm5', runtime: 'codex', source: 'herdr',
}));
test('census partitions reported statuses without pretending unknown/offline are leisure', () => {
  assert.deepEqual(townCounts(bots), { total: 6, working: 1, resting: 2, blocked: 1, unknown: 1, offline: 1 });
  assert.equal(Object.values(townCounts([])).reduce((a, b) => a + b, 0), 0);
});
test('resident filters preserve honest status semantics and search source/project case-insensitively', () => {
  assert.deepEqual(filterResidents(bots, 'resting', '').map(b => b.status), ['idle', 'done']);
  assert.deepEqual(filterResidents(bots, 'blocked', '').map(b => b.status), ['blocked']);
  assert.deepEqual(filterResidents(bots, 'unknown', '').map(b => b.status), ['unknown']);
  assert.deepEqual(filterResidents(bots, 'offline', '').map(b => b.status), ['offline']);
  assert.deepEqual(filterResidents(bots, 'all', '  ARRA  ').map(b => b.id), ['b1']);
  assert.equal(filterResidents(bots, 'working', 'herdr').length, 1);
  assert.equal(filterResidents(bots, 'all', 'missing').length, 0);
});
test('attention cycles actual blocked residents only, including wrap and stale selection', () => {
  const roster = [...bots, { ...bots[2], id: 'second-blocked' }];
  assert.equal(nextAttention(roster, null)?.id, 'b2');
  assert.equal(nextAttention(roster, 'b2')?.id, 'second-blocked');
  assert.equal(nextAttention(roster, 'second-blocked')?.id, 'b2');
  assert.equal(nextAttention(roster, 'gone')?.id, 'b2');
  assert.equal(nextAttention(bots.filter(b => b.status !== 'blocked'), null), null);
});
test('game shortcuts never steal typing, modified keys or repeated input', () => {
  const e = { key: 'r', target: { tagName: 'DIV' } };
  assert.equal(hudShortcut(e), 'residents');
  assert.equal(hudShortcut({ ...e, key: 'J' }), 'journal');
  assert.equal(hudShortcut({ ...e, key: 'M' }), 'map');
  assert.equal(hudShortcut({ ...e, key: 'T' }), 'terminal');
  assert.equal(hudShortcut({ ...e, key: '7' }), 'district:6');
  assert.equal(hudShortcut({ ...e, key: '0' }), 'district:9');
  assert.equal(hudShortcut({ ...e, key: 'C' }), 'cabinet');
  assert.equal(hudShortcut({ ...e, key: 'h' }), 'walk');
  assert.equal(hudShortcut({ ...e, key: 'b' }), 'music');
  assert.equal(hudShortcut({ ...e, key: 'Escape' }), 'close');
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']) assert.equal(hudShortcut({ ...e, target: { tagName } }), null);
  assert.equal(hudShortcut({ ...e, target: { isContentEditable: true } }), null);
  for (const flag of ['metaKey', 'ctrlKey', 'altKey', 'shiftKey', 'repeat']) assert.equal(hudShortcut({ ...e, [flag]: true }), null);
  assert.equal(hudShortcut({ ...e, key: '9' }), 'district:8');
  assert.equal(hudShortcut({ ...e, key: 'x' }), null);
});

test('a citizen answers the human from its observed status only', async () => {
  const { greeting } = await import('../lib/hud.ts');
  assert.match(greeting({ status: 'working', project: 'neo-oracle' }), /working on neo-oracle/);
  assert.match(greeting({ status: 'blocked' }), /waiting for a human/);
  assert.match(greeting({ status: 'idle' }, 'Having a beer'), /Hi! Having a beer\./);
  assert.match(greeting({ status: 'unknown' }), /not reported/);
});

test('the nation score: brighter by day, slower minor chords at night, repeatable arpeggios', async () => {
  const { moodFor, chordNotes, arpeggio, DAY, NIGHT, midiToHz } = await import('../components/music/music.score.ts');
  assert.equal(moodFor(12), DAY); assert.equal(moodFor(23), NIGHT); assert.equal(moodFor(5), NIGHT); assert.equal(moodFor(6), DAY);
  assert.ok(NIGHT.bpm < DAY.bpm && NIGHT.cutoff < DAY.cutoff);
  assert.deepEqual(chordNotes(DAY, 0), [60, 64, 67, 71]);
  assert.deepEqual(chordNotes(DAY, 4), chordNotes(DAY, 0));
  assert.deepEqual(arpeggio(3), arpeggio(3));
  assert.equal(arpeggio(3).length, 16);
  assert.ok(Math.abs(midiToHz(69) - 440) < 1e-9);
});

test('command palette: fuzzy finds citizens, places and actions; terminals only for live data', async () => {
  const { fuzzyScore, rank } = await import('../components/palette/palette.match.ts');
  const { paletteItems } = await import('../components/palette/palette.items.ts');
  assert.ok(fuzzyScore('neo', 'neo-oracle') > fuzzyScore('neo', 'the generic one'));
  assert.equal(fuzzyScore('xyz', 'neo-oracle'), 0);
  assert.ok(fuzzyScore('mof', 'Ministry of Federation') > 0);
  const bots = [{ id: 'a', name: 'neo-oracle', status: 'working', project: 'neo', host: 'm5', runtime: 'claude' }, { id: 'b', name: 'thor-oracle', status: 'idle', project: 'thor', host: 'white', runtime: 'claude' }];
  const zones = [{ id: 'brewery', name: 'Brewery' }, { id: 'meeting', name: 'Parliament' }];
  const live = paletteItems({ bots, zones, preview: false, walking: false, music: false });
  assert.equal(rank(live, 'thor', item => `${item.label} ${item.search}`)[0].action.id, 'b');
  assert.equal(rank(live, 'brew', item => `${item.label} ${item.search}`)[0].action.zone, 'brewery');
  assert.equal(rank(live, 'parl', item => `${item.label} ${item.search}`)[0].action.zone, 'meeting');
  assert.ok(live.some(item => item.action.kind === 'terminal' && item.action.id === 'a'));
  assert.ok(!paletteItems({ bots, zones, preview: true, walking: false, music: false }).some(item => item.action.kind === 'terminal'));
  assert.equal(rank(live, 'music', item => `${item.label} ${item.search}`)[0].action.kind, 'music');
});
