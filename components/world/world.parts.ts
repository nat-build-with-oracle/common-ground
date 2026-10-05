import type { Built } from "./world.types.ts";

export const blank = (w: number, d: number): Built => ({ w, d, boxes: [], seats: [], homes: [], pois: [], lifeSpots: { waiting: [], community: [], drinks: [], garden: [] }, meeting: [], households: [] });

export function backWall(out: Built, color?: string) {
  out.boxes.push({ kind: "wall", x: 0, z: -out.d / 2 + .12, w: out.w, d: .24, h: 1.25, accent: color });
}
