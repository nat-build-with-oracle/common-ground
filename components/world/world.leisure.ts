// Off-duty places: the café, the brewery and the garden.
import type { Built } from "./world.types.ts";
import { backWall, blank } from "./world.parts.ts";

export function cafe(): Built {
  const out = blank(12, 9); backWall(out); out.boxes.push({ kind: "coffee", x: -3, z: -3.7, w: 1.7, d: .7, h: 1 }, { kind: "counter", x: 0, z: -3.7, w: 2.8, d: .7, h: .9 }, { kind: "fridge", x: 3.8, z: -3.65, w: .8, d: .75, h: 1.8 });
  for (let i = 0; i < 12; i += 1) { const x = -4 + i % 4 * 2.6, z = -.8 + Math.floor(i / 4) * 2.1; out.lifeSpots.drinks.push({ x, z, yaw: i % 2 ? Math.PI / 2 : -Math.PI / 2, label: "Getting a drink", emoji: "☕" }); if (i % 2 === 0) out.boxes.push({ kind: "table", x: x + 1, z, w: .8, d: .8, h: .65, round: true }); }
  return out;
}

/** A working brewery: brewhouse (mash tun, lauter tun, boil kettle) with a steaming stack, grain silo,
 *  fermentation hall, taproom with bar stools, and a beer garden under string lights. */
export function brewery(): Built {
  const out = blank(18, 12.5); backWall(out, "#c98a3d");
  const back = -out.d / 2;
  out.boxes.push({ kind: "brewsign", x: 0, z: back + .3, w: 3.2, d: .3, h: 2.6 });
  out.boxes.push({ kind: "silo", x: -out.w / 2 + 1.1, z: back + 1.2, w: 1.6, d: 1.6, h: 4.6, round: true });
  [-5.3, -3.6, -1.9].forEach((x, i) => out.boxes.push({ kind: "kettle", x, z: back + 1.4, w: 1.45, d: 1.45, h: 1.9, round: true, owner: i === 2 ? "stack" : undefined }));
  [1.4, 3.0, 4.6, 6.2].forEach(x => out.boxes.push({ kind: "tank", x, z: back + 1.3, w: 1.35, d: 1.35, h: 2.9, round: true }));
  out.boxes.push({ kind: "barrel", x: out.w / 2 - .8, z: back + 3.3, w: .9, d: .9, h: 1.0, round: true }, { kind: "barrel", x: out.w / 2 - .8, z: back + 4.3, w: .9, d: .9, h: 1.0, round: true });
  // taproom (right, front): the bar, stools in front of it, a chalkboard
  out.boxes.push({ kind: "taps", x: 4.2, z: 0, w: 4.2, d: .8, h: 1.05 }, { kind: "menu", x: out.w / 2 - .7, z: -.2, w: 1.2, d: .2, h: 1.8 });
  for (let i = 0; i < 5; i += 1) {
    const x = 2.6 + i * .8;
    out.boxes.push({ kind: "stool", x, z: 1.05, w: .38, d: .38, h: .72, round: true });
    out.lifeSpots.drinks.push({ x, z: 1.65, yaw: Math.PI, label: "At the brewery bar", emoji: "🍺" });
  }
  // beer garden (left, front): picnic benches under string lights
  out.boxes.push({ kind: "lights", x: -4.2, z: out.d / 2 - 2.6, w: 8.6, d: .14, h: 2.6, decor: true });
  for (let i = 0; i < 4; i += 1) {
    const x = -6.6 + (i % 2) * 4.2, z = .6 + Math.floor(i / 2) * 2.7;
    out.boxes.push({ kind: "bench", x, z, w: 2.2, d: .7, h: .75 });
    out.lifeSpots.drinks.push({ x: x - .55, z: z - .9, yaw: 0, label: "Beer garden", emoji: "🍻" }, { x: x + .55, z: z + .9, yaw: Math.PI, label: "Beer garden", emoji: "🍻" });
  }
  return out;
}

export function garden(): Built {
  const out = blank(14, 10);
  [[-5, -3], [-2, -3], [2, -3], [5, -3], [-5, 3], [-2, 3], [2, 3], [5, 3]].forEach(([x, z], i) => out.boxes.push({ kind: i % 3 ? "tree" : "plant", x, z, w: .7, d: .7, h: i % 3 ? 2.5 : 1.1 }));
  for (let i = 0; i < 12; i += 1) out.lifeSpots.garden.push({ x: -4.5 + i % 4 * 3, z: -1.5 + Math.floor(i / 4) * 1.6, yaw: (i % 4) * Math.PI / 2, label: "Walking in the garden", emoji: "🌿" });
  return out;
}
