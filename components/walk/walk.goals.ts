// Where a citizen should be. Observed status decides (work → desk, waiting for input → petition office,
// offline → home); idle and done citizens follow a simulated, deterministic daily rhythm.
import type { OracleBot } from "@/lib/fleet-types";
import { lifeDestination, lifePhase, stableIndex, type LifeDestination } from "../../lib/life.ts";
import type { Seat, Spot, World } from "../world.ts";

export type GoalKind = "desk" | "poi" | "meet" | "home" | "waiting" | "life";
export type Goal = { x: number; z: number; yaw: number; kind: GoalKind; label?: string; emoji?: string; poi?: number };
/** Spots already handed out this round, per destination, so two citizens never share one. */
export type Claims = Map<LifeDestination, Set<number>>;

const toGoal = (place: Seat | Spot, kind: GoalKind, extra: Partial<Goal> = {}): Goal => ({ x: place.x, z: place.z, yaw: place.yaw, kind, ...("label" in place ? { label: place.label, emoji: place.emoji } : {}), ...extra });

export function goalFor(world: World, bot: OracleBot, wall: number, claims: Claims): Goal | null {
  const seat = world.seats.get(bot.id), bed = world.homes.get(bot.id);
  const fallback = () => bed ? toGoal(bed, "home") : seat ? toGoal(seat, "desk") : null;
  const where = lifeDestination(bot.status, bot.id, wall);
  if (where === "desk") return seat ? toGoal(seat, "desk") : null;
  if (where === "home") return bed ? toGoal(bed, "home", { label: "At home (simulated)", emoji: "🏠" }) : seat ? toGoal(seat, "desk") : null;
  const spots = where === "parliament" ? world.meeting : world.lifeSpots[where];
  if (!spots.length) return fallback();
  const taken = claims.get(where) ?? new Set<number>();
  claims.set(where, taken);
  const first = stableIndex(bot.id, spots.length, where === "waiting" ? "waiting" : `${where}:${lifePhase(bot.id, wall)}`);
  for (let step = 0; step < spots.length; step += 1) {
    const index = (first + step) % spots.length;
    if (taken.has(index)) continue;
    taken.add(index);
    return toGoal(spots[index], where === "waiting" ? "waiting" : "life");
  }
  return fallback();
}
