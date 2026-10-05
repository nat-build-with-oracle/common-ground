// Decide which districts the town has, then place them in rows with roads between.
import type { OracleBot } from "@/lib/fleet-types";
import type { LifeSpots, Spec, World } from "./world.types.ts";
import { campus, workStyle } from "./world.work.ts";
import { commons, federationMinistry, parliament, plaza } from "./world.civic.ts";
import { brewery, cafe, garden } from "./world.leisure.ts";
import { pitch } from "./world.sport.ts";
import { neighborhood } from "./world.homes.ts";

export function buildWorld(bots: OracleBot[], sections: { id: string; name: string }[]): World {
  const specs: Spec[] = [];
  const known = new Set(sections.map(section => section.id));
  const grouped = new Map<string, OracleBot[]>();
  for (const bot of bots) { const id = bot.sectionId && known.has(bot.sectionId) ? bot.sectionId : "campus"; grouped.set(id, [...(grouped.get(id) ?? []), bot]); }
  if (!grouped.size) grouped.set("campus", []);
  for (const [id, members] of grouped) {
    const name = sections.find(section => section.id === id)?.name || "Work campus", style = workStyle(name);
    specs.push({ id, name: `Ministry of Work · ${name}`, emoji: style.emoji, theme: style.theme, floor: style.floor, built: campus(id, members, style.theme) });
  }
  specs.push(
    { id: "meeting", name: "Parliament", emoji: "🏛️", theme: "parliament", floor: "#c8b48a", built: parliament() },
    { id: "federation", name: "Ministry of Federation", emoji: "🌐", theme: "ministry", floor: "#9fb2c4", built: federationMinistry() },
    { id: "commons", name: "Petition office", emoji: "✋", theme: "commons", floor: "#b6afa0", built: commons(bots.length) },
    { id: "cafe", name: "Drinks cafe", emoji: "☕", theme: "cafe", floor: "#b08e72", built: cafe() },
    { id: "brewery", name: "Brewery", emoji: "🍺", theme: "brewery", floor: "#a08256", built: brewery() },
    { id: "plaza", name: "Ministry of Community", emoji: "🏙️", theme: "plaza", floor: "#9fa6a0", built: plaza() },
    { id: "pitch", name: "Ministry of Sport", emoji: "⚽", theme: "pitch", floor: "#4f8a47", built: pitch() },
    { id: "garden", name: "Town garden", emoji: "🌿", theme: "garden", floor: "#7d9a78", built: garden() },
    { id: "neighborhood", name: "Ministry of Home", emoji: "🏘️", theme: "neighborhood", floor: "#8ca084", built: neighborhood(bots) },
  );
  const gap = 3.4, maxWidth = bots.length > 30 ? 66 : 54;
  return assemble(intoRows(specs, maxWidth, gap), gap);
}

/** Fill rows left to right; a district that would push a row past `maxWidth` starts the next one. */
function intoRows(specs: Spec[], maxWidth: number, gap: number) {
  const rows: Spec[][] = [];
  let width = Infinity;
  for (const spec of specs) {
    if (width + spec.built.w > maxWidth) { rows.push([]); width = 0; }
    rows[rows.length - 1].push(spec);
    width += spec.built.w + gap;
  }
  return rows;
}

const moved = <T extends { x: number; z: number }>(item: T, dx: number, dz: number): T => ({ ...item, x: item.x + dx, z: item.z + dz });

/** Lay the rows front to back with a road between each pair. In a row, districts line up on the road in front of them. */
function assemble(rows: Spec[][], gap: number): World {
  const bands = rows.map(row => ({ row, depth: Math.max(...row.map(spec => spec.built.d)), width: row.reduce((sum, spec) => sum + spec.built.w, 0) + gap * (row.length - 1) }));
  const w = Math.max(...bands.map(band => band.width)), d = bands.reduce((sum, band) => sum + band.depth, 0) + gap * (bands.length - 1);
  const world: World = { zones: [], boxes: [], streets: [], households: [], seats: new Map(), homes: new Map(), pois: [], lifeSpots: { waiting: [], community: [], drinks: [], garden: [] }, meeting: [], w, d };
  let back = -d / 2;
  bands.forEach((band, index) => {
    let left = -w / 2;
    for (const spec of band.row) {
      const { built } = spec, cx = left + built.w / 2, cz = back + band.depth - built.d / 2;
      world.zones.push({ id: spec.id, name: spec.name, emoji: spec.emoji, theme: spec.theme, floor: spec.floor, x: cx, z: cz, w: built.w, d: built.d });
      world.boxes.push(...built.boxes.map(box => moved(box, cx, cz)));
      for (const [id, seat] of built.seats) world.seats.set(id, moved(seat, cx, cz));
      for (const [id, bed] of built.homes) world.homes.set(id, moved(bed, cx, cz));
      world.pois.push(...built.pois.map(spot => moved(spot, cx, cz)));
      world.meeting.push(...built.meeting.map(spot => moved(spot, cx, cz)));
      for (const purpose of Object.keys(world.lifeSpots) as (keyof LifeSpots)[]) world.lifeSpots[purpose].push(...built.lifeSpots[purpose].map(spot => moved(spot, cx, cz)));
      world.households.push(...built.households.map(household => household.house ? { ...household, house: moved(household.house, cx, cz) } : household));
      left += built.w + gap;
    }
    back += band.depth + gap;
    if (index < bands.length - 1) world.streets.push({ kind: "road", x: 0, z: back - gap / 2, w: w + 4, d: gap - .6 });
  });
  world.streets.push({ kind: "path", x: 0, z: 0, w: 2.2, d: d + 4 }); // the long walk through the middle of town
  return world;
}

/** Where the human enters the nation: the open road in front of the Ministry of Community (never beside the fountain). */
export function humanSpawn(world: World): { x: number; z: number } {
  const square = world.zones.find(zone => zone.id === "plaza") ?? world.zones[0];
  if (!square) return { x: 0, z: 0 };
  const front = square.z + square.d / 2;
  const road = world.streets.filter(street => street.kind === "road").sort((a, b) => Math.abs(a.z - front) - Math.abs(b.z - front))[0];
  return { x: square.x, z: road ? road.z : front + 1.5 };
}
