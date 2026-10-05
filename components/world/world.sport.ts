// Ministry of Sport: a football pitch with two goals. The pitch markings are decor; goal posts and nets are solid.
import type { Built } from "./world.types.ts";
import { blank } from "./world.parts.ts";

/** Pitch geometry shared by the district, the match rules and the scene. Local to the district centre; the pitch is long along x. */
export const PITCH = { w: 22, d: 14, halfLength: 10.2, halfWidth: 6.4, mouth: 4, goalDepth: .8, postHeight: 2.1 } as const;

export function pitch(): Built {
  const out = blank(PITCH.w, PITCH.d), { halfLength, mouth, goalDepth, postHeight } = PITCH;
  out.boxes.push({ kind: "pitchmark", x: 0, z: 0, w: PITCH.w - .6, d: PITCH.d - .6, h: .02, decor: true });
  for (const side of [-1, 1]) {
    const back = side * (halfLength + goalDepth);
    out.boxes.push(
      { kind: "goalpost", x: side * halfLength, z: -mouth / 2, w: .2, d: .2, h: postHeight },
      { kind: "goalpost", x: side * halfLength, z: mouth / 2, w: .2, d: .2, h: postHeight },
      { kind: "goalnet", x: back, z: 0, w: .1, d: mouth, h: postHeight },
      { kind: "goalnet", x: side * (halfLength + goalDepth / 2), z: -mouth / 2, w: goalDepth, d: .1, h: postHeight },
      { kind: "goalnet", x: side * (halfLength + goalDepth / 2), z: mouth / 2, w: goalDepth, d: .1, h: postHeight },
      { kind: "crossbar", x: side * halfLength, z: 0, w: .12, d: mouth, h: .12, decor: true },
    );
  }
  out.boxes.push({ kind: "bench", x: -3, z: PITCH.d / 2 - .4, w: 2, d: .5, h: .45 }, { kind: "bench", x: 3, z: PITCH.d / 2 - .4, w: 2, d: .5, h: .45 });
  // Spectator spots along both touchlines (simulated citizens in the community routine come to watch).
  for (let i = 0; i < 6; i += 1) for (const side of [-1, 1]) out.lifeSpots.community.push({ x: -6.5 + i * 2.6, z: side * (PITCH.halfWidth + .4), yaw: side > 0 ? Math.PI : 0, label: "Watching football", emoji: "⚽" });
  return out;
}
