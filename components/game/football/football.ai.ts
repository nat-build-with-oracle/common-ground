// Simple football brains, pure: given the ball and everyone's position, return where to run and (maybe) a kick.
import { attackDir, KEEPER_INSET, type Field, type Team } from "./football.rules.ts";
import { stableHash } from "../../../lib/life.ts";

export type Mover = { id: string; team: Team; x: number; z: number; keeper?: boolean };
export type BallState = { x: number; z: number; vx: number; vz: number };
export type Kick = { x: number; y: number; z: number };
export type Role = "chaser" | "support" | "keeper";
export type Decision = { role: Role; target: { x: number; z: number }; kick?: Kick };

export const KICK_RANGE = 1.0, SHOT_RANGE = 9, MIN_POWER = 5.5, MAX_POWER = 12, CHARGE_SECONDS = .8;

/** Ball velocity (ground speed in units/s) from a start point towards an aim point. */
export function kickToward(from: { x: number; z: number }, to: { x: number; z: number }, power: number, lift = .8): Kick {
  const dx = to.x - from.x, dz = to.z - from.z, length = Math.hypot(dx, dz) || 1;
  return { x: dx / length * power, y: lift, z: dz / length * power };
}
/** Hold F to charge: power grows from a tap to a full-strength kick. */
export const chargePower = (held: number) => MIN_POWER + (MAX_POWER - MIN_POWER) * Math.min(1, Math.max(0, held) / CHARGE_SECONDS);
export const nearest = <T extends { x: number; z: number }>(from: { x: number; z: number }, others: T[]): T | undefined =>
  others.reduce<T | undefined>((best, o) => (!best || Math.hypot(o.x - from.x, o.z - from.z) < Math.hypot(best.x - from.x, best.z - from.z) ? o : best), undefined);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/** Decide for one simulated player. `mates` are its teammates (the human too); keepers never chase. */
export function think(field: Field, me: Mover, mates: Mover[], ball: BallState, keeper: boolean): Decision {
  const dir = attackDir(me.team), ownLine = field.cx - dir * field.halfLength, goal = { x: field.cx + dir * field.halfLength, z: field.cz };
  const here = { x: ball.x, z: ball.z };
  if (keeper) {
    const reach = field.mouth / 2 - .5, target = { x: ownLine + dir * KEEPER_INSET, z: clamp(ball.z, field.cz - reach, field.cz + reach) };
    const near = Math.abs(ball.x - ownLine) < 5 && dist(me, here) < 1.6;
    return { role: "keeper", target: near ? here : target, kick: dist(me, here) < KICK_RANGE + .3 ? kickToward(me, { x: me.x + dir * 8, z: field.cz + (ball.z - field.cz) * -.8 }, 9) : undefined };
  }
  const runners = [me, ...mates.filter(m => m.id !== me.id && !m.keeper)];
  const chaser = runners.reduce((best, m) => (dist(m, here) < dist(best, here) - 1e-6 || (Math.abs(dist(m, here) - dist(best, here)) <= 1e-6 && m.id < best.id) ? m : best), runners[0]);
  if (chaser.id === me.id) {
    const lead = { x: ball.x + ball.vx * .25, z: ball.z + ball.vz * .25 };
    if (dist(me, here) > KICK_RANGE) return { role: "chaser", target: lead };
    const wobble = (stableHash(`${me.id}:${Math.floor(ball.x)}`) % 3 - 1) * field.mouth * .22; // aim a little left, middle or right
    const shot = dist(me, goal) < SHOT_RANGE;
    return { role: "chaser", target: here, kick: kickToward(me, { x: goal.x, z: goal.z + wobble }, shot ? 11 : 7, shot ? 1.4 : .6) };
  }
  const x = clamp(ball.x + dir * 3.5, field.cx - field.halfLength + 2, field.cx + field.halfLength - 1.5);
  const z = clamp(field.cz + (ball.z > field.cz ? -3 : 3), field.cz - field.halfWidth + 1, field.cz + field.halfWidth - 1);
  return { role: "support", target: { x, z } };
}
