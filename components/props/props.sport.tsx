"use client";
// The Ministry of Sport: grass stripes with white lines, goal posts, crossbars and nets.
import { R, type P } from "./props.parts";

const LINE = "#f4f1e6";
const Line = ({ w, d, x = 0, z = 0 }: { w: number; d: number; x?: number; z?: number }) => (
  <mesh rotation-x={-Math.PI / 2} position={[x, .085, z]}><planeGeometry args={[w, d]} /><meshBasicMaterial color={LINE} /></mesh>
);

/** Pitch markings: mowing stripes, touchlines, halfway line, centre circle and spot, penalty areas. */
export function PitchMark({ b }: P) {
  const hl = b.w / 2 - .3, hw = b.d / 2 - .3, t = .09;
  return <group position={[b.x, 0, b.z]}>
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[-hl + (i + .5) * (2 * hl / 8), .06, 0]}><planeGeometry args={[2 * hl / 8, 2 * hw]} /><meshStandardMaterial color={i % 2 ? "#4b8643" : "#579a4d"} roughness={1} /></mesh>)}
    <Line w={2 * hl} d={t} z={-hw} /><Line w={2 * hl} d={t} z={hw} /><Line w={t} d={2 * hw} x={-hl} /><Line w={t} d={2 * hw} x={hl} /><Line w={t} d={2 * hw} />
    <mesh rotation-x={-Math.PI / 2} position={[0, .09, 0]}><ringGeometry args={[1.7, 1.79, 40]} /><meshBasicMaterial color={LINE} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, .1, 0]}><circleGeometry args={[.13, 14]} /><meshBasicMaterial color={LINE} /></mesh>
    {[-1, 1].map(s => <group key={s}><Line w={t} d={6} x={s * (hl - 2.4)} /><Line w={2.4} d={t} x={s * (hl - 1.2)} z={-3} /><Line w={2.4} d={t} x={s * (hl - 1.2)} z={3} /></group>)}
  </group>;
}

export const GoalPost = ({ b }: P) => <R args={[b.w, b.h, b.d]} pos={[b.x, b.h / 2, b.z]} color={LINE} r={.04} />;
export const Crossbar = ({ b }: P) => <R args={[b.w, b.h, b.d]} pos={[b.x, 2.04, b.z]} color={LINE} r={.04} />;
export const GoalNet = ({ b }: P) => (
  <mesh position={[b.x, b.h / 2, b.z]}><boxGeometry args={[b.w, b.h, b.d]} /><meshStandardMaterial color="#e8eef0" transparent opacity={.28} wireframe={false} depthWrite={false} /></mesh>
);
