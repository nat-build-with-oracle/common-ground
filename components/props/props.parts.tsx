"use client";
// Building blocks for furniture. Materials are shared per colour (a town has hundreds of props),
// rounded blocks for anything a hand would touch, posts for legs and stems, puffs for steam, LEDs that blink.
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MeshStandardMaterial, type Group, type Mesh } from "three";
import { stableHash } from "@/lib/life";
import type { Box } from "../world";

/** Every prop draws inside its layout box: x/z centre, w/d/h size. Colliders use the same box. */
export type P = { b: Box };
export type V3 = [number, number, number];

const shared = new Map<string, MeshStandardMaterial>();
/** One material per colour (+glow), reused by every prop that asks for it. */
export function paint(color: string, glow = 0, rough = .75): MeshStandardMaterial {
  const key = `${color}|${glow}|${rough}`;
  let material = shared.get(key);
  if (!material) { material = new MeshStandardMaterial({ color, roughness: rough, emissive: glow ? new Color(color) : new Color(0), emissiveIntensity: glow }); shared.set(key, material); }
  return material;
}

/** A block with softened edges. `e`/`ei`: emissive colour and strength (screens, lamps). */
export function R({ args, pos, color, r = .05, e, ei = 0, shadow = true }: { args: V3; pos: V3; color: string; r?: number; e?: string; ei?: number; shadow?: boolean }) {
  const radius = Math.max(.001, Math.min(r, args[0] / 2 - .001, args[1] / 2 - .001, args[2] / 2 - .001));
  const material = e && e !== color ? new MeshStandardMaterial({ color, roughness: .75, emissive: new Color(e), emissiveIntensity: ei }) : paint(color, ei);
  return <RoundedBox args={args} radius={radius} smoothness={2} position={pos} material={material} castShadow={shadow} receiveShadow />;
}

/** A post: legs, stems, pots, tanks. `rt` narrows or widens the top. */
export function Cyl({ r, h, pos, color, rt = r, seg = 18 }: { r: number; h: number; pos: V3; color: string; rt?: number; seg?: number }) {
  return <mesh position={pos} material={paint(color, 0, .7)} castShadow receiveShadow><cylinderGeometry args={[rt, r, h, seg]} /></mesh>;
}

const puffMaterial = new MeshStandardMaterial({ color: "#ffffff", transparent: true, depthWrite: false, opacity: .5 });
/** Steam: four puffs rising, swelling and thinning out on a loop. */
export function Steam({ pos }: { pos: V3 }) {
  const group = useRef<Group>(null), puffs = useMemo(() => [0, 1, 2, 3].map(() => puffMaterial.clone()), []);
  useFrame(({ clock }) => group.current?.children.forEach((puff, i) => {
    const life = (clock.elapsedTime * .5 + i / 4) % 1;
    puff.position.set(Math.sin(life * 5 + i * 2) * .04, life * .55, Math.cos(life * 4 + i) * .02);
    puff.scale.setScalar(.04 + life * .1);
    ((puff as Mesh).material as MeshStandardMaterial).opacity = .55 * (1 - life);
  }));
  return <group ref={group} position={pos}>{puffs.map((material, i) => <mesh key={i} material={material}><sphereGeometry args={[1, 8, 6]} /></mesh>)}</group>;
}

/** A status LED that blinks on its own rhythm (seeded, so every LED differs but never changes between visits). */
export function Blinky({ pos, color, speed }: { pos: V3; color: string; speed: number }) {
  const mesh = useRef<Mesh>(null), seed = stableHash(`${pos.join(",")}:${color}`) % 997;
  useFrame(({ clock }) => {
    const material = mesh.current?.material as MeshStandardMaterial | undefined;
    if (material) material.emissiveIntensity = (Math.floor(clock.elapsedTime * speed + seed) % 3) === 0 ? .2 : 2.4;
  });
  return <mesh ref={mesh} position={pos}><boxGeometry args={[.035, .02, .01]} /><meshStandardMaterial color={color} emissive={color} /></mesh>;
}
