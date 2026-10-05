// Ministry of Home: one home per project household, in one of several styles.
import type { OracleBot } from "@/lib/fleet-types";
import { stableIndex } from "../../lib/life.ts";
import type { Built, HouseStyle } from "./world.types.ts";
import { blank } from "./world.parts.ts";

const CAR_COLORS = ["#2d3138", "#e9e4da", "#b8443a", "#3d5a80", "#5f7a61"];

/** Big households share a condo; small ones may live in a cottage; the rest vary by a stable per-household seed. */
export function houseStyle(members: number, seed: number): { style: HouseStyle; floors: number } {
  if (members >= 5) return { style: "condo", floors: 4 + seed % 2 };
  const options: HouseStyle[] = members <= 2 ? ["cottage", "stilt", "villa", "townhouse"] : ["townhouse", "stilt", "villa"];
  const style = options[seed % options.length];
  return { style, floors: style === "townhouse" ? (members >= 3 ? 3 : 2 + seed % 2) : style === "villa" ? 2 : 1 };
}

export function neighborhood(bots: OracleBot[]): Built {
  const grouped = new Map<string, OracleBot[]>();
  for (const bot of bots) { const key = bot.project?.trim() || "Independent oracles"; grouped.set(key, [...(grouped.get(key) ?? []), bot]); }
  if (!grouped.size) grouped.set("Model household", []);
  const homes = [...grouped.entries()].map(([name, members], index) => {
    const cols = Math.min(4, Math.max(1, members.length)), rows = Math.max(1, Math.ceil(members.length / cols));
    return { name, members, id: `household-${index}`, cols, rows, w: Math.max(6.4, cols * 1.45 + 2.2), d: Math.max(6.6, rows * 2.1 + 4.3) };
  });
  // Side yards hold the car and the palm; the front yard is the walk in from the street.
  const cols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(homes.length * 1.5)))), cellW = Math.max(9, ...homes.map(h => h.w + 2.9)), cellD = Math.max(8.4, ...homes.map(h => h.d + 1.9));
  const out = blank(cols * cellW + 1.5, Math.ceil(homes.length / cols) * cellD + 1.5);
  homes.forEach((home, index) => {
    const cx = -out.w / 2 + 1 + cellW / 2 + index % cols * cellW, cz = -out.d / 2 + 1 + cellD / 2 + Math.floor(index / cols) * cellD;
    const seed = stableIndex(home.name, 9973, "house"), accent = home.members[0]?.color ?? "#71dec0";
    const { style, floors } = houseStyle(home.members.length, seed);
    out.households.push({ id: home.id, name: `${home.name} household (simulated)`, members: home.members.map(member => member.id), zoneId: "neighborhood", house: { x: cx, z: cz, w: home.w, d: home.d, floors, accent, seed, style } });
    // Ground-floor walls are the only part of a home that blocks walking; everything above is drawn by components/home.
    out.boxes.push({ kind: "townwall", x: cx, z: cz - home.d / 2 + .12, w: home.w, d: .24, h: 1.25 });
    out.boxes.push({ kind: "townwall", x: cx - home.w / 2 + .12, z: cz, w: .24, d: home.d, h: 1.25 }, { kind: "townwall", x: cx + home.w / 2 - .12, z: cz, w: .24, d: home.d, h: 1.25 });
    if (style !== "cottage" && style !== "stilt") out.boxes.push({ kind: "car", x: cx + home.w / 2 + .75, z: cz + home.d / 2 - 1.15, w: .92, d: 1.95, h: .95, accent: CAR_COLORS[seed % CAR_COLORS.length] });
    out.boxes.push({ kind: "palm", x: cx - home.w / 2 - .7, z: cz + home.d / 2 - .55, w: .42, d: .42, h: 3.3, round: true });
    const members = home.members.length ? home.members : [undefined];
    members.forEach((member, i) => {
      // Front row first: beds sit in the street-side band so a sleeper stays visible under the storeys above.
      const x = cx - (home.cols - 1) * .725 + i % home.cols * 1.45, bedZ = cz + home.d / 2 - 1.75 - Math.floor(i / home.cols) * 2.1;
      out.boxes.push({ kind: "bed", x, z: bedZ, w: 1.05, d: 1.45, h: .42, accent: member?.color });
      if (member) out.homes.push([member.id, { x, z: bedZ + 1.4, yaw: Math.PI, zone: "neighborhood" }]);
    });
  });
  return out;
}
