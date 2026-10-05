import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, canPlay, clockText, idleMatch, outOfPlay, pickTeams, result, scoreGoal, startMatch, startSpot, stillFree, KICKOFF_SECONDS, GOAL_SECONDS } from "../components/game/football/football.rules.ts";
import { chargePower, kickToward, think, KICK_RANGE } from "../components/game/football/football.ai.ts";
import { buildWorld } from "../components/world.ts";
import { PITCH } from "../components/world/world.sport.ts";

const field = { cx: 0, cz: 0, halfLength: PITCH.halfLength, halfWidth: PITCH.halfWidth, mouth: PITCH.mouth, goalDepth: PITCH.goalDepth };
const statuses = ["working", "blocked", "offline", "idle", "done", "unknown"];
const bots = Array.from({ length: 30 }, (_, i) => ({ id: `b${i}`, status: statuses[i % 6] }));

test("only idle and done citizens are eligible, never working, blocked, unknown or offline", () => {
  const roster = pickTeams(bots), byId = new Map(bots.map(b => [b.id, b]));
  const all = [...roster.home, ...roster.away];
  assert.ok(all.length > 0);
  for (const id of all) assert.ok(["idle", "done"].includes(byId.get(id).status), id);
  for (const s of ["working", "blocked", "offline", "unknown"]) assert.equal(canPlay(s), false);
  assert.equal(pickTeams(bots.filter(b => !canPlay(b.status))).home.length + pickTeams(bots.filter(b => !canPlay(b.status))).away.length, 0);
});

test("teams are deterministic, disjoint, capped at four a side and balanced", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, status: "idle" }));
  const a = pickTeams(many), b = pickTeams([...many].reverse());
  assert.deepEqual(a, b);
  assert.equal(a.home.length, 4); assert.equal(a.away.length, 4);
  assert.equal(new Set([...a.home, ...a.away]).size, 8);
  const three = pickTeams(many.slice(0, 3));
  assert.equal(three.away.length, 2); assert.equal(three.home.length, 1); // you make up the other home player
});

test("a citizen who goes back to work leaves the match", () => {
  const roster = pickTeams(many());
  const leaver = roster.home[0];
  const now = many().map(b => (b.id === leaver ? { ...b, status: "working" } : b));
  const next = stillFree(roster, now);
  assert.ok(!next.home.includes(leaver) && next.home.length === roster.home.length - 1);
  assert.equal(stillFree(roster, []).away.length, 0);
  function many() { return Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, status: "done" })); }
});

test("kickoff, play, goal, kickoff, full time", () => {
  let m = startMatch(10);
  assert.equal(m.phase, "kickoff");
  m = advance(m, KICKOFF_SECONDS + .01); assert.equal(m.phase, "playing");
  m = scoreGoal(m, 0); assert.equal(m.phase, "goal"); assert.deepEqual(m.score, [1, 0]);
  assert.deepEqual(scoreGoal(m, 1).score, [1, 0], "no goals while the ball is dead");
  m = advance(m, GOAL_SECONDS + .01); assert.equal(m.phase, "kickoff"); assert.equal(m.kickoff, 1, "the side that conceded kicks off");
  m = advance(m, KICKOFF_SECONDS + .01); m = advance(m, 4); assert.ok(Math.abs(m.clock - 6) < 1e-9, "clock only runs while playing");
  m = advance(m, 100); assert.equal(m.phase, "fulltime"); assert.equal(m.clock, 0);
  assert.equal(advance(m, 5).phase, "fulltime");
  assert.equal(advance(idleMatch(), 5).phase, "idle");
});

test("a goal in the last second still counts; the clock waits, then full time", () => {
  let m = advance(startMatch(1), KICKOFF_SECONDS + .01);
  m = advance(m, .99); m = scoreGoal(m, 1);
  m = advance(m, GOAL_SECONDS + .01); assert.equal(m.phase, "kickoff");
  m = advance(m, KICKOFF_SECONDS + .01); m = advance(m, 1);
  assert.equal(m.phase, "fulltime"); assert.deepEqual(m.score, [0, 1]);
});

test("result and clock text", () => {
  assert.equal(result({ ...idleMatch(), score: [2, 2] }).winner, null);
  assert.equal(result({ ...idleMatch(), score: [3, 1] }).winner, 0);
  assert.match(result({ ...idleMatch(), score: [0, 1] }).text, /Monsoons win 1–0/);
  assert.equal(clockText(180), "3:00"); assert.equal(clockText(59.2), "1:00"); assert.equal(clockText(-4), "0:00");
});

test("restart spots stay on their own half, keeper on the line, non-kicking side outside the centre circle", () => {
  for (const team of [0, 1]) for (const count of [1, 2, 4]) for (const kicks of [true, false]) for (let i = 0; i < count; i++) {
    const p = startSpot(field, team, i, count, kicks), dir = team === 0 ? 1 : -1;
    assert.ok(p.x * dir <= 0 && Math.abs(p.x) <= field.halfLength && Math.abs(p.z) <= field.halfWidth, `${team}/${count}/${i}`);
    if (!kicks) assert.ok(Math.hypot(p.x, p.z) > 1.7, "outside the centre circle");
  }
  assert.equal(startSpot(field, 0, 0, 3, true).x, -(field.halfLength - 1.2));
});

test("ball out of play comes back inside; inside the pitch and goal mouths it stays", () => {
  assert.equal(outOfPlay(field, 3, 2), null);
  assert.equal(outOfPlay(field, field.halfLength + .5, 0), null, "inside the goal");
  const back = outOfPlay(field, field.halfLength + .5, 4);
  assert.ok(back && Math.abs(back.x) < field.halfLength && Math.abs(back.z) <= field.halfWidth);
  const side = outOfPlay(field, 0, 30);
  assert.ok(side && side.z <= field.halfWidth);
});

const mover = (id, team, x, z) => ({ id, team, x, z });
const still = { vx: 0, vz: 0 };

test("the nearest outfield player chases, the others support, the keeper holds the line", () => {
  const ball = { x: 2, z: 1, ...still };
  const me = mover("a", 0, 0, 0), far = mover("b", 0, -6, 3), keeper = { ...mover("k", 0, -9, 0), keeper: true };
  assert.equal(think(field, me, [far, keeper], ball, false).role, "chaser");
  const sup = think(field, far, [me, keeper], ball, false);
  assert.equal(sup.role, "support"); assert.equal(sup.kick, undefined);
  const k = think(field, keeper, [me, far], { x: 4, z: 3, ...still }, true);
  assert.equal(k.role, "keeper"); assert.ok(k.target.x < -8 && Math.abs(k.target.z) <= field.mouth / 2);
});

test("a chaser on the ball kicks towards the opponent goal, either way round", () => {
  for (const team of [0, 1]) {
    const dir = team === 0 ? 1 : -1, ball = { x: 3 * dir, z: 0, ...still }, me = mover("a", team, 3 * dir - .3 * dir, 0);
    const d = think(field, me, [], ball, false);
    assert.equal(d.role, "chaser"); assert.ok(d.kick, "kicks when close");
    assert.ok(d.kick.x * dir > 0, "towards the opponent goal"); assert.ok(d.kick.y > 0);
  }
  const far = think(field, mover("a", 0, -5, 0), [], { x: 3, z: 0, ...still }, false);
  assert.equal(far.kick, undefined); assert.ok(Math.hypot(far.target.x - 3, far.target.z) < 1, "runs at the ball");
  assert.ok(KICK_RANGE > 0);
});

test("kick vectors have the requested ground speed, and charging grows power", () => {
  const k = kickToward({ x: 0, z: 0 }, { x: 3, z: 4 }, 10);
  assert.ok(Math.abs(Math.hypot(k.x, k.z) - 10) < 1e-9);
  assert.ok(chargePower(0) < chargePower(.4) && chargePower(.4) < chargePower(.8) && chargePower(5) === chargePower(.8));
});

test("the pitch district exists, is about 22 x 14, and has solid goals with open mouths", () => {
  const world = buildWorld([], []);
  const zone = world.zones.find(z => z.id === "pitch");
  assert.ok(zone && zone.name === "Ministry of Sport" && zone.w === 22 && zone.d === 14);
  const posts = world.boxes.filter(b => b.kind === "goalpost" && !b.decor);
  assert.equal(posts.length, 4);
  const mouthBlockers = world.boxes.filter(b => !b.decor && Math.abs(b.z - zone.z) < PITCH.mouth / 2 - .3 && Math.abs(Math.abs(b.x - zone.x) - PITCH.halfLength) < .3 && b.kind !== "goalnet");
  assert.equal(mouthBlockers.length, 0, "nothing between the posts");
  assert.ok(world.lifeSpots.community.some(s => s.label === "Watching football"));
});
