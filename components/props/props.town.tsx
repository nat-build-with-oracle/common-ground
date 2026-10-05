"use client";
// Outdoor and home things: beds, trees, fountain, lamps, the pickup in the side yard, palms.
import { Cyl, R, type P } from "./props.parts";

export const Bed = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><R args={[b.w, .25, b.d]} pos={[0, .125, 0]} color="#806b5d" r={.08} /><R args={[b.w - .08, .18, b.d - .12]} pos={[0, .31, .02]} color={b.accent ?? "#7cf4bb"} r={.08} /><R args={[b.w * .62, .12, .34]} pos={[0, .44, -b.d / 2 + .25]} color="#edf3ee" r={.05} /></group>
);

export const Tree = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={.14} h={1.25} pos={[0, .625, 0]} color="#6f503b" rt={.19} />{[[0, 1.55, 0, .62], [-.35, 1.75, .08, .46], [.35, 1.78, -.05, .48], [0, 2.12, 0, .42]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={i % 2 ? "#4f8b62" : "#65a873"} flatShading /></mesh>)}</group>
);

export const Fountain = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={b.w / 2} h={.28} pos={[0, .14, 0]} color="#879794" seg={40} /><Cyl r={b.w / 2 - .22} h={.12} pos={[0, .31, 0]} color="#68b8c5" seg={40} /><Cyl r={.18} h={.7} pos={[0, .58, 0]} color="#aebbb7" /><mesh position={[0, .96, 0]}><sphereGeometry args={[.2, 16, 12]} /><meshStandardMaterial color="#8ad8e0" emissive="#70c5d0" emissiveIntensity={.35} /></mesh></group>
);

export const Lamp = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={.07} h={b.h} pos={[0, b.h / 2, 0]} color="#34443d" /><mesh position={[0, b.h, 0]} castShadow><sphereGeometry args={[.18, 14, 10]} /><meshStandardMaterial color="#fff0bc" emissive="#ffd978" emissiveIntensity={1.2} /></mesh></group>
);

/** A small pickup parked in the side yard, nose to the street (+z). */
export function Car({ b }: P) {
  const c = b.accent ?? "#2d3138", L = b.d, W = b.w;
  return <group position={[b.x, 0, b.z]}>
    <R args={[W, .34, L]} pos={[0, .4, 0]} color={c} r={.07} />
    <R args={[W - .06, .36, L * .42]} pos={[0, .74, L * .16]} color={c} r={.08} />
    <R args={[W - .02, .2, L * .42 - .12]} pos={[0, .78, L * .16]} color="#26313b" r={.03} shadow={false} />
    {[-1, 1].map(s => <R key={s} args={[.06, .16, L * .48]} pos={[s * (W / 2 - .03), .64, -L * .25]} color={c} r={.02} shadow={false} />)}
    <R args={[W, .16, .06]} pos={[0, .64, -L / 2 + .03]} color={c} r={.02} shadow={false} />
    {[-1, 1].flatMap(s => [-1, 1].map(f => <mesh key={`${s}${f}`} position={[s * (W / 2 - .04), .18, f * L * .3]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[.18, .18, .15, 16]} /><meshStandardMaterial color="#1d1f24" roughness={.9} /></mesh>))}
    {[-1, 1].map(s => <R key={`h${s}`} args={[.18, .08, .03]} pos={[s * (W / 2 - .17), .46, L / 2 + .005]} color="#fff4c7" e="#ffe9a3" ei={.8} shadow={false} />)}
  </group>;
}

const LEAN = [0, .05, .13, .24];
export const Palm = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    {LEAN.map((x, i) => <Cyl key={i} r={.12 - i * .012} rt={.11 - i * .012} h={.82} pos={[x, .41 + i * .8, 0]} color={i % 2 ? "#8a6a4a" : "#7a5c40"} />)}
    <group position={[.28, 3.2, 0]}>
      {Array.from({ length: 7 }, (_, i) => <group key={i} rotation-y={i / 7 * Math.PI * 2}><mesh position={[.55, -.12, 0]} rotation-z={-.38} castShadow><boxGeometry args={[1.15, .03, .3]} /><meshStandardMaterial color={i % 2 ? "#4f9a5c" : "#62ad6a"} flatShading /></mesh></group>)}
      {[0, 1, 2].map(i => <mesh key={`n${i}`} position={[Math.cos(i * 2.1) * .12, -.12, Math.sin(i * 2.1) * .12]} castShadow><sphereGeometry args={[.08, 10, 8]} /><meshStandardMaterial color="#6b4a2c" /></mesh>)}
    </group>
  </group>
);
