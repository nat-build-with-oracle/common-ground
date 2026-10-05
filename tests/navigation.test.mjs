import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld } from '../components/world.ts';
import { Nav } from '../components/crowd.ts';
import { layoutTriangles } from '../components/walk/walk.mesh.ts';

const statuses=['working','blocked','offline','idle','done','unknown'];
const bots=Array.from({length:52},(_,i)=>({id:`oracle-${i}`,name:`Oracle ${i}`,title:'Codex',color:'#71dec0',sectionId:'work',preview:'',status:statuses[i%6],working:i%6===0,source:'herdr',host:'local',runtime:'codex',pane:`test:${i}`,project:`project-${i%12}`,href:'',seenAt:1}));

test('52 real crowd agents spawn in status zones and return to work when status changes',async()=>{
 const world=buildWorld(bots,[{id:'work',name:'Oracle campus'}]);
 const nav=await Nav.create(world,bots);
 try {
   assert.equal(nav.rts.size,52);
   for(const bot of bots){const rt=nav.rts.get(bot.id);assert.ok(Number.isFinite(rt.x)&&Number.isFinite(rt.z));
     if(bot.status==='working')assert.equal(rt.goal.kind,'desk');
     if(bot.status==='offline')assert.equal(rt.goal.kind,'home');
     if(['blocked','unknown'].includes(bot.status))assert.equal(rt.goal.kind,'waiting');
     if(['idle','done'].includes(bot.status))assert.ok(['home','life'].includes(rt.goal.kind));
   }
   const working=bots.map(bot=>({...bot,status:'working',working:true}));
   nav.think(performance.now(),working,[],[]);
   assert.ok([...nav.rts.values()].every(rt=>rt.goal.kind==='desk'));
   for(let i=0;i<120;i++)nav.update(1/30);
   assert.ok([...nav.rts.values()].every(rt=>Number.isFinite(rt.x)&&Number.isFinite(rt.z)));
   nav.think(performance.now(),bots.map(bot=>({...bot,status:'offline',working:false})),[],[]);
   assert.ok([...nav.rts.values()].every(rt=>rt.goal.kind==='home'));
 } finally { nav.destroy(); }
});

test('all 52 waiting citizens have distinct destinations and quiet routines stay put', async () => {
  const waiting=bots.map(bot=>({...bot,status:'blocked',working:false}));
  const world=buildWorld(waiting,[{id:'work',name:'Oracle campus'}]);
  const nav=await Nav.create(world,waiting);
  try {
    const spots=[...nav.rts.values()].map(rt=>`${rt.goal.x},${rt.goal.z}`);
    assert.equal(new Set(spots).size,52);
    assert.ok([...nav.rts.values()].every(rt=>rt.goal.kind==='waiting'));
    const idle=waiting.map(bot=>({...bot,status:'idle'}));
    nav.think(0,idle,[],[],false);
    const before=[...nav.rts.values()].map(rt=>[rt.goal.kind,rt.goal.x,rt.goal.z]);
    const original=Date.now;
    try { Date.now=()=>original()+600_000; nav.think(600_000,idle,[],[],false); }
    finally { Date.now=original; }
    assert.deepEqual([...nav.rts.values()].map(rt=>[rt.goal.kind,rt.goal.x,rt.goal.z]),before);
    assert.equal(new Set(before.map(([,x,z])=>`${x},${z}`)).size,52);
  } finally {nav.destroy();}
});

test('the human walks in every direction from where they enter, and leaves cleanly', async () => {
  const { humanSpawn } = await import('../components/world.ts');
  const world = buildWorld(bots, [{ id: 'work', name: 'Oracle campus' }]);
  const nav = await Nav.create(world, bots);
  try {
    const at = humanSpawn(world);
    for (const [vx, vz] of [[0, -1.9], [1.9, 0], [0, 1.9], [-1.9, 0]]) {
      nav.removePlayer();
      const rt = nav.spawnPlayer(at.x, at.z), x0 = rt.x, z0 = rt.z;
      for (let i = 0; i < 30; i++) { nav.steerPlayer(vx, vz); nav.update(1 / 30); }
      assert.ok(Math.hypot(rt.x - x0, rt.z - z0) > 1, `stuck walking (${vx},${vz}) from ${at.x},${at.z}`);
      assert.ok(rt.speed > 1, 'reports walking speed for the walk animation');
    }
    assert.ok(![...nav.rts.keys()].some(id => id.startsWith('human')), 'the human is never a citizen');
    nav.removePlayer();
    assert.equal(nav.playerRt, undefined);
  } finally { nav.destroy(); }
});

test('citizens are drawn moving between crowd steps, even at exactly 30 fps', async () => {
  const world = buildWorld(bots, [{ id: 'work', name: 'Oracle campus' }]);
  const nav = await Nav.create(world, bots);
  try {
    nav.think(performance.now(), bots.map(bot => ({ ...bot, status: 'working', working: true })), [], []);
    const start = new Map([...nav.rts].map(([id, rt]) => [id, [rt.x, rt.z]]));
    for (let i = 0; i < 90; i++) nav.update(1 / 30);
    const moved = [...nav.rts].filter(([id, rt]) => Math.hypot(rt.x - start.get(id)[0], rt.z - start.get(id)[1]) > .5).length;
    assert.ok(moved >= bots.length * .6, `only ${moved} of ${bots.length} citizens were drawn walking`);
  } finally { nav.destroy(); }
});

test('decor (string lights) never blocks walking; the brewery has a bar and a beer garden', async () => {
  const world = buildWorld(bots, [{ id: 'work', name: 'Oracle campus' }]);
  const brewery = world.zones.find(zone => zone.id === 'brewery');
  const inside = item => Math.abs(item.x - brewery.x) < brewery.w / 2 && Math.abs(item.z - brewery.z) < brewery.d / 2;
  const kinds = new Set(world.boxes.filter(inside).map(box => box.kind));
  for (const kind of ['kettle', 'silo', 'tank', 'taps', 'stool', 'bench', 'lights', 'brewsign']) assert.ok(kinds.has(kind), kind);
  assert.ok(world.boxes.filter(box => box.kind === 'lights').every(box => box.decor));
  const labels = new Set(world.lifeSpots.drinks.filter(inside).map(spot => spot.label));
  assert.ok(labels.has('At the brewery bar') && labels.has('Beer garden'));
  const nav = await Nav.create(world, bots);
  try {
    const lights = world.boxes.find(box => box.kind === 'lights');
    nav.removePlayer();
    const rt = nav.spawnPlayer(lights.x, lights.z + 1.2), z0 = rt.z;
    for (let i = 0; i < 45; i++) { nav.steerPlayer(0, -1.9); nav.update(1 / 30); }
    assert.ok(z0 - rt.z > 2, `blocked under the string lights (moved ${(z0 - rt.z).toFixed(2)})`);
  } finally { nav.destroy(); }
});

test('fast travel: every district entrance is walkable ground you can walk on from', async () => {
  const world = buildWorld(bots, [{ id: 'work', name: 'Oracle campus' }]);
  const nav = await Nav.create(world, bots);
  try {
    const at = (await import('../components/world.ts')).humanSpawn(world);
    const rt = nav.spawnPlayer(at.x, at.z);
    for (const zone of world.zones) {
      const tx = zone.x, tz = zone.z + zone.d / 2 + .9;
      nav.teleportPlayer(tx, tz, Math.PI);
      assert.ok(Math.hypot(rt.x - tx, rt.z - tz) < .6, `${zone.id}: landed ${rt.x.toFixed(2)},${rt.z.toFixed(2)} not near ${tx.toFixed(2)},${tz.toFixed(2)}`);
      const x0 = rt.x;
      for (let i = 0; i < 20; i++) { nav.steerPlayer(1.9, 0); nav.update(1 / 30); }
      assert.ok(Math.abs(rt.x - x0) > .5, `${zone.id}: stuck after arriving`);
    }
  } finally { nav.destroy(); }
});

test('click to walk: the human paths to a clicked spot and stops; keys take over', async () => {
  const world = buildWorld(bots, [{ id: 'work', name: 'Oracle campus' }]);
  const nav = await Nav.create(world, bots);
  try {
    const at = (await import('../components/world.ts')).humanSpawn(world);
    const rt = nav.spawnPlayer(at.x, at.z);
    const goal = { x: at.x + 6, z: at.z };
    nav.walkPlayerTo(goal.x, goal.z);
    for (let i = 0; i < 150 && nav.playerTarget; i++) { nav.steerPlayer(0, 0); nav.update(1 / 30); }
    assert.equal(nav.playerTarget, undefined, 'arrived and cleared the route');
    assert.ok(Math.hypot(rt.x - goal.x, rt.z - goal.z) < .5, `ended ${rt.x.toFixed(2)},${rt.z.toFixed(2)}`);
    nav.walkPlayerTo(at.x - 6, at.z);
    nav.steerPlayer(0, 1.9);
    assert.equal(nav.playerTarget, undefined, 'a key press cancels the route');
  } finally { nav.destroy(); }
});

test('walkable surface: every block face points outward, so only tops and the ground can be walked on', () => {
  const world = { w: 10, d: 10, boxes: [{ kind: 'desk', x: 2, z: -1, w: 1.2, d: .7, h: .76 }, { kind: 'lights', x: 0, z: 0, w: 4, d: .2, h: 3, decor: true }] };
  const { positions, indices } = layoutTriangles(world);
  assert.equal(indices.length / 3, 24, 'ground slab and the desk: 12 triangles each; decor adds none');
  const at = i => positions.slice(i * 3, i * 3 + 3);
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [at(indices[t]), at(indices[t + 1]), at(indices[t + 2])];
    const e1 = b.map((v, k) => v - a[k]), e2 = c.map((v, k) => v - a[k]);
    const normal = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const block = t < 36 ? { x: 0, y: -.1, z: 0 } : { x: 2, y: .38, z: -1 };
    const centroid = [0, 1, 2].map(k => (a[k] + b[k] + c[k]) / 3), out = [centroid[0] - block.x, centroid[1] - block.y, centroid[2] - block.z];
    assert.ok(normal[0] * out[0] + normal[1] * out[1] + normal[2] * out[2] > 0, `triangle ${t / 3} faces inward`);
  }
});
