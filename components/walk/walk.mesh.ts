// Bake the walkable surface from the town layout. The ground is a thin slab whose top is y = 0;
// every solid layout box is a closed block standing on it. Recast carves the blocks out (plus a margin
// of one body radius), and what is left is everywhere a citizen can stand.
import type { NavMesh } from "recast-navigation";
import { generateSoloNavMesh } from "recast-navigation/generators";
import type { World } from "../world.ts";

/** Voxel size, and the body every walker is planned for (metres). */
const CELL = .1, LAYER = .05, BODY = { radius: .5, height: 1.5, step: .2 };
/** Anything lower than this still blocks: beds and benches are not stepping stones. */
const MIN_BLOCK = .6;

// The 8 corners of a block (bottom ring 0-3, top ring 4-7) and its 6 faces, each counter-clockwise seen from
// outside: Recast takes a triangle's facing from its winding, and only up-facing triangles can be walked on.
const RING: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const FACES = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]; // bottom, top, then the four sides

function block(positions: number[], indices: number[], cx: number, cz: number, w: number, d: number, bottom: number, top: number) {
  const first = positions.length / 3;
  for (const y of [bottom, top]) for (const [sx, sz] of RING) positions.push(cx + sx * w / 2, y, cz + sz * d / 2);
  for (const [a, b, c, e] of FACES) indices.push(first + a, first + b, first + c, first + a, first + c, first + e);
}

/** Triangles for the ground and every solid box (decor is drawn but never blocks). */
export function layoutTriangles(world: World) {
  const positions: number[] = [], indices: number[] = [];
  block(positions, indices, 0, 0, world.w + 8, world.d + 8, -.2, 0);
  for (const box of world.boxes) if (!box.decor) block(positions, indices, box.x, box.z, box.w, box.d, 0, Math.max(box.h, MIN_BLOCK));
  return { positions, indices };
}

export function bakeNavMesh(world: World): NavMesh {
  const { positions, indices } = layoutTriangles(world);
  const result = generateSoloNavMesh(positions, indices, {
    cs: CELL, ch: LAYER, walkableSlopeAngle: 40, maxEdgeLen: 40,
    walkableRadius: Math.ceil(BODY.radius / CELL), walkableHeight: Math.ceil(BODY.height / LAYER), walkableClimb: Math.floor(BODY.step / LAYER),
  });
  if (!result.success) throw new Error(`Could not bake the walkable surface: ${result.error ?? "unknown"}`);
  return result.navMesh;
}
