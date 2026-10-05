"use client";
// Building blocks shared by every home style.
import { useMemo } from "react";
import { Shape, type Material } from "three";
import type { Mats } from "./home.materials";

export type V3 = [number, number, number];
export const STOREY = 1.85, SLAB = .16;

export function B({ s, p, m, r }: { s: V3; p: V3; m: Material; r?: V3 }) {
  return <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>;
}
export function C({ r, h, p, m, rt = r, seg = 18 }: { r: number; h: number; p: V3; m: Material; rt?: number; seg?: number }) {
  return <mesh position={p} material={m} castShadow receiveShadow><cylinderGeometry args={[rt, r, h, seg]} /></mesh>;
}
export function Plant({ p, mats, scale = 1 }: { p: V3; mats: Mats; scale?: number }) {
  return <group position={p} scale={scale}><C r={.16} rt={.2} h={.32} p={[0, .16, 0]} m={mats.pot} /><mesh position={[0, .52, 0]} material={mats.leaf} castShadow><icosahedronGeometry args={[.3, 1]} /></mesh><mesh position={[.1, .78, .05]} material={mats.leaf} castShadow><icosahedronGeometry args={[.2, 1]} /></mesh></group>;
}

/** A gable roof over a w × d footprint, ridge running front to back, rising `rise` above `y`. */
export function Gable({ w, d, y, rise, m, gable, overhang = .3 }: { w: number; d: number; y: number; rise: number; m: Material; gable?: Material; overhang?: number }) {
  const half = w / 2 + overhang, slope = Math.hypot(half, rise), pitch = Math.atan2(rise, half);
  const shape = useMemo(() => { const s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise); s.closePath(); return s; }, [w, rise]);
  return <group position={[0, y, 0]}>
    {[-1, 1].map(side => <mesh key={side} position={[side * half / 2, rise / 2, 0]} rotation={[0, 0, -side * pitch]} material={m} castShadow receiveShadow><boxGeometry args={[slope, .1, d + overhang * 2]} /></mesh>)}
    {gable && [-1, 1].map(side => <mesh key={`g${side}`} position={[0, 0, side * (d / 2)]} rotation={[0, side < 0 ? Math.PI : 0, 0]} material={gable} castShadow><shapeGeometry args={[shape]} /></mesh>)}
  </group>;
}
