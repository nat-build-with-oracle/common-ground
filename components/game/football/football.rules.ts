// Football match rules, pure: phases, clock, score, who plays and where everyone restarts.
// Imports use relative .ts paths so `node --test` can load this file.
import { stableHash } from "../../../lib/life.ts";
import type { OracleStatus } from "../../../lib/fleet-types.ts";

export type Phase = "idle" | "kickoff" | "playing" | "goal" | "fulltime";
export type Team = 0 | 1;
export type Match = { phase: Phase; score: [number, number]; clock: number; timer: number; kickoff: Team; scorer: Team | null };
/** Pitch in world coordinates. Team 0 (home, you) defends the -x goal and attacks +x. */
export type Field = { cx: number; cz: number; halfLength: number; halfWidth: number; mouth: number; goalDepth: number };
export type Roster = { home: string[]; away: string[] };

export const MATCH_SECONDS = 180, KICKOFF_SECONDS = 3, GOAL_SECONDS = 3, PER_SIDE = 4;
export const TEAM_NAMES = ["Lanterns", "Monsoons"] as const;
export const TEAM_COLORS = ["#e8604c", "#4a90d9"] as const;
export const attackDir = (team: Team): 1 | -1 => (team === 0 ? 1 : -1);
export const otherTeam = (team: Team): Team => (team === 0 ? 1 : 0);

export const idleMatch = (): Match => ({ phase: "idle", score: [0, 0], clock: MATCH_SECONDS, timer: 0, kickoff: 0, scorer: null });
export const startMatch = (seconds = MATCH_SECONDS): Match => ({ phase: "kickoff", score: [0, 0], clock: seconds, timer: KICKOFF_SECONDS, kickoff: 0, scorer: null });

/** Move the clock and the phase timers forward. The ball and the players are not our business here. */
export function advance(match: Match, dt: number): Match {
  if (match.phase === "kickoff") {
    const timer = match.timer - dt;
    return timer > 0 ? { ...match, timer } : { ...match, phase: "playing", timer: 0 };
  }
  if (match.phase === "playing") {
    const clock = match.clock - dt;
    return clock > 0 ? { ...match, clock } : { ...match, phase: "fulltime", clock: 0 };
  }
  if (match.phase === "goal") {
    const timer = match.timer - dt;
    if (timer > 0) return { ...match, timer };
    return match.clock <= 0 ? { ...match, phase: "fulltime", timer: 0 } : { ...match, phase: "kickoff", timer: KICKOFF_SECONDS, kickoff: otherTeam(match.scorer ?? 0) };
  }
  return match;
}

/** A goal only counts while the ball is in play. */
export function scoreGoal(match: Match, team: Team): Match {
  if (match.phase !== "playing") return match;
  const score: [number, number] = [match.score[0] + (team === 0 ? 1 : 0), match.score[1] + (team === 1 ? 1 : 0)];
  return { ...match, phase: "goal", score, timer: GOAL_SECONDS, scorer: team };
}

export function result(match: Match): { winner: Team | null; text: string } {
  const [a, b] = match.score, winner = a === b ? null : a > b ? 0 : 1;
  return { winner, text: winner === null ? `Draw ${a}–${b}` : `${TEAM_NAMES[winner]} win ${Math.max(a, b)}–${Math.min(a, b)}` };
}

export const clockText = (seconds: number) => { const s = Math.max(0, Math.ceil(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/** Only idle or done citizens have free time. Working, blocked, unknown and offline ones never play. */
export const canPlay = (status: OracleStatus) => status === "idle" || status === "done";

/** Deterministic teams from citizen ids (you join home on top). Away gets the odd citizen so the sides stay even once you join. */
export function pickTeams(bots: { id: string; status: OracleStatus }[], perSide = PER_SIDE): Roster {
  const pool = bots.filter(bot => canPlay(bot.status)).map(bot => bot.id)
    .sort((a, b) => stableHash(`football:${a}`) - stableHash(`football:${b}`) || a.localeCompare(b)).slice(0, perSide * 2);
  return { away: pool.filter((_, i) => i % 2 === 0), home: pool.filter((_, i) => i % 2 === 1) };
}

/** Drop anyone whose real status stopped being idle/done (or who vanished) since the match began. */
export function stillFree(roster: Roster, bots: { id: string; status: OracleStatus }[]): Roster {
  const free = new Set(bots.filter(bot => canPlay(bot.status)).map(bot => bot.id));
  return { home: roster.home.filter(id => free.has(id)), away: roster.away.filter(id => free.has(id)) };
}

/** Slots in your own half, in the attacking frame: x < 0 is towards your own goal. The first slot is the one near the centre spot. */
const SLOTS: [number, number][] = [[-1, 0], [-4.5, -3.2], [-4.5, 3.2], [-7.5, 0]];
export const KEEPER_INSET = 1.2;
export const hasKeeper = (count: number) => count >= 2;

/** Where bot `index` of `count` on `team` stands for a kickoff. Index 0 keeps goal when the side has two or more. */
export function startSpot(field: Field, team: Team, index: number, count: number, kicksOff: boolean): { x: number; z: number } {
  const dir = attackDir(team);
  if (hasKeeper(count) && index === 0) return { x: field.cx - dir * (field.halfLength - KEEPER_INSET), z: field.cz };
  const k = index - (hasKeeper(count) ? 1 : 0), [sx, sz] = SLOTS[Math.min(k, SLOTS.length - 1)];
  const back = k === 0 && !kicksOff ? 2.4 : 0; // the side that does not kick off stays out of the centre circle
  return { x: field.cx + dir * (sx - back), z: field.cz + sz };
}

/** Where you stand for a kickoff (home only): behind the kicker, a little off the line. */
export const humanSpot = (field: Field, team: Team = 0) => ({ x: field.cx + attackDir(team) * -3, z: field.cz + 1.6 });

/** If the ball left the pitch, the spot to put it back (on the touchline, inside). Null while it is in play or inside a goal. */
export function outOfPlay(field: Field, x: number, z: number): { x: number; z: number } | null {
  const dx = Math.abs(x - field.cx), dz = Math.abs(z - field.cz);
  const onPitch = dx <= field.halfLength + .3 && dz <= field.halfWidth + .5;
  const inGoal = dx <= field.halfLength + field.goalDepth + .3 && dz <= field.mouth / 2 + .3;
  if (onPitch || inGoal) return null;
  const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
  return { x: field.cx + clamp(x - field.cx, field.halfLength - 1), z: field.cz + clamp(z - field.cz, field.halfWidth - .6) };
}
