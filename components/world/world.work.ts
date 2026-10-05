// Ministry of Work: one campus of desks per machine or session. Its name decides how it is dressed.
import type { OracleBot } from "@/lib/fleet-types";
import type { Built, Theme } from "./world.types.ts";
import { backWall, blank } from "./world.parts.ts";

type Dress = { theme: Theme; emoji: string; floor: string };
/** Words in a section name (English or Thai) that pick a dress; anything else is a plain lab. */
const DRESSES: [RegExp, Dress][] = [
  [/support|ops|infra|สนับสนุน/i, { theme: "support", emoji: "🧰", floor: "#9fb8bd" }],
  [/lead|exec|chief|บริหาร/i, { theme: "exec", emoji: "👔", floor: "#aaa8c1" }],
  [/front|sales|shop|ลูกค้า|หน้า/i, { theme: "front", emoji: "🛎️", floor: "#cdb3ac" }],
  [/kitchen|food|ครัว/i, { theme: "kitchen", emoji: "🍳", floor: "#d5c7a6" }],
];
const LAB: Dress = { theme: "lab", emoji: "⌨️", floor: "#aeb5ad" };

export function workStyle(name: string): Dress {
  return DRESSES.find(([words]) => words.test(name))?.[1] ?? LAB;
}

const PITCH_X = 2.65, PITCH_Z = 2.75;  // desk spacing: a chair and an aisle each way, after the walking margin
const MIN_DESKS = 8;                    // a campus is never tiny; empty desks wait for newcomers

/** Rows of desks facing the back wall (counters for kitchens and shops), a board or server rack in the corner,
 *  and the town plan pinned up on the other side. */
export function campus(id: string, bots: OracleBot[], theme: Theme): Built {
  const desks = Math.max(bots.length, MIN_DESKS);
  const columns = Math.min(9, Math.max(4, Math.ceil(Math.sqrt(desks * 1.5))));
  const out = blank(columns * PITCH_X + 1.6, Math.ceil(desks / columns) * PITCH_Z + 3.3);
  const left = -out.w / 2, back = -out.d / 2;
  backWall(out);
  out.boxes.push({ kind: theme === "support" ? "rack" : "board", x: left + 1.1, z: back + .55, w: 1.25, d: .55, h: 1.55 });
  const furniture = theme === "kitchen" || theme === "front" ? "counter" : "desk";
  for (let index = 0; index < desks; index += 1) {
    const owner = bots[index], x = left + 1.25 + (index % columns) * PITCH_X, z = back + 2.5 + Math.floor(index / columns) * PITCH_Z;
    if (owner) out.seats.push([owner.id, { zone: id, x, z, yaw: 0 }]);
    out.boxes.push({ kind: furniture, x, z: z + .9, w: 1.22, d: .72, h: .76, accent: owner?.color ?? "#66d8aa", owner: owner?.id });
  }
  out.pois.push({ label: "Review the town plan", emoji: "🗺️", x: -left - 1.1, z: back + 1.1, yaw: Math.PI });
  return out;
}
