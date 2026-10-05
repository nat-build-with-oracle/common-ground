import type { OracleStatus } from "./fleet-types";

export type LifeDestination = "desk" | "waiting" | "home" | "community" | "drinks" | "garden" | "parliament";

export function stableHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function stableIndex(id: string, length: number, salt = "") {
  return length > 0 ? stableHash(`${salt}:${id}`) % length : -1;
}

export const ROUTINE_PERIOD = 300_000;
export function lifePhase(id: string, now: number) {
  return Math.floor((now + stableHash(`schedule:${id}`) % ROUTINE_PERIOD) / ROUTINE_PERIOD);
}

/** About a third of idle citizens are members of Parliament (simulated). */
export const isMember = (id: string) => stableHash(`mp:${id}`) % 3 === 0;
/** Parliament sits for the first 15 minutes of every hour; with routines off (now = 0) it is always in session. */
export const inSession = (now: number) => now === 0 || new Date(now).getUTCMinutes() < 15;

/** Simulation-only routine. It never changes or infers the real fleet status. */
export function lifeDestination(status: OracleStatus, id: string, now = Date.now()): LifeDestination {
  if (status === "working") return "desk";
  if (status === "blocked" || status === "unknown") return "waiting";
  if (status === "offline") return "home";
  if (isMember(id) && inSession(now)) return "parliament";
  const routine: LifeDestination[] = status === "done"
    ? ["home", "community", "home", "drinks", "garden", "home"]
    : ["home", "home", "community", "drinks", "garden", "home"];
  const phase = lifePhase(id, now);
  return routine[(stableHash(id) + phase) % routine.length];
}
