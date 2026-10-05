"use client";
// The brewery's kit: fermentation tanks, oak barrels and the tap bar.
import { Cyl, R, Steam, type P } from "./props.parts";

export const Tank = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={b.w / 2} h={b.h - .5} pos={[0, (b.h - .5) / 2 + .25, 0]} color="#cfd8dc" seg={32} />{[.9, 1.7].map(y => <Cyl key={y} r={b.w / 2 + .02} h={.06} pos={[0, y, 0]} color="#8d9aa0" seg={32} />)}<mesh position={[0, b.h - .2, 0]} castShadow><coneGeometry args={[b.w / 2, .45, 32]} /><meshStandardMaterial color="#b9c4c9" roughness={.5} /></mesh>{[-1, 1].map(s => <Cyl key={s} r={.05} h={.3} pos={[s * (b.w / 2 - .15), .15, b.d / 2 - .3]} color="#6f7b80" />)}<R args={[.34, .24, .05]} pos={[0, 1.35, b.d / 2 + .01]} color="#ffb84d" e="#ffb84d" ei={.5} shadow={false} /></group>
);

export const Barrel = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={b.w / 2 - .04} h={b.h} pos={[0, b.h / 2, 0]} color="#9b6b3f" rt={b.w / 2} seg={24} />{[.22, .78].map(y => <Cyl key={y} r={b.w / 2 + .01} h={.05} pos={[0, y, 0]} color="#3f3a36" seg={24} />)}<Cyl r={b.w / 2 - .06} h={.03} pos={[0, b.h + .01, 0]} color="#b98652" seg={24} /></group>
);

const HANDLES = ["#ffb84d", "#e0584f", "#6bcb77", "#4d96ff", "#c77dff"];
export const Taps = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><R args={[b.w, b.h - .08, b.d]} pos={[0, (b.h - .08) / 2, 0]} color="#7a5230" r={.06} /><R args={[b.w + .1, .08, b.d + .1]} pos={[0, b.h - .04, 0]} color="#c9955c" r={.04} /><R args={[b.w - .2, .12, .1]} pos={[0, b.h + .55, -b.d / 2 + .12]} color="#8d9aa0" r={.03} />{HANDLES.map((color, i) => { const x = -b.w / 2 + .5 + i * (b.w - 1) / 4; return <group key={i} position={[x, b.h, -b.d / 2 + .12]}><Cyl r={.025} h={.5} pos={[0, .3, 0]} color="#c9d3d8" /><R args={[.07, .2, .07]} pos={[0, .62, 0]} color={color} r={.02} shadow={false} /><group position={[0, .02, .3]}><Cyl r={.07} h={.17} pos={[0, .085, 0]} color="#f2c14e" rt={.08} /><Cyl r={.075} h={.05} pos={[0, .19, 0]} color="#fff7e0" rt={.085} /></group></group>; })}</group>
);

/** Copper brewhouse vessel on short legs, domed lid, manway; the last one carries the steaming stack. */
export const Kettle = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z]) => <Cyl key={`${x}${z}`} r={.05} h={.35} pos={[x * b.w * .3, .17, z * b.w * .3]} color="#5d5f63" />)}
    <mesh position={[0, .35 + (b.h - .35) / 2, 0]} castShadow receiveShadow><cylinderGeometry args={[b.w / 2, b.w / 2, b.h - .5, 28]} /><meshStandardMaterial color="#b87333" metalness={.75} roughness={.28} /></mesh>
    <mesh position={[0, b.h - .15, 0]} castShadow><sphereGeometry args={[b.w / 2, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c8844a" metalness={.75} roughness={.25} /></mesh>
    <mesh position={[0, b.h * .55, b.w / 2]} rotation-x={Math.PI / 2}><torusGeometry args={[.18, .03, 8, 20]} /><meshStandardMaterial color="#d9d2c4" metalness={.6} roughness={.3} /></mesh>
    {b.owner === "stack" && <><Cyl r={.12} h={2.6} pos={[0, b.h + 1.1, 0]} color="#c9d2d6" /><Steam pos={[0, b.h + 2.45, 0]} /></>}
  </group>
);

/** Grain silo: tall drum, conical cap, a ladder up the side. */
export const Silo = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow><cylinderGeometry args={[b.w / 2, b.w / 2, b.h, 28]} /><meshStandardMaterial color="#d9dde0" metalness={.4} roughness={.45} /></mesh>
    {[1, 2, 3].map(i => <Cyl key={i} r={b.w / 2 + .02} h={.05} pos={[0, i * b.h / 4, 0]} color="#9aa3a8" seg={28} />)}
    <mesh position={[0, b.h + .35, 0]} castShadow><coneGeometry args={[b.w / 2 + .05, .7, 28]} /><meshStandardMaterial color="#b9c2c7" metalness={.4} roughness={.4} /></mesh>
    {[-1, 1].map(s => <R key={s} args={[.04, b.h, .04]} pos={[s * .16, b.h / 2, b.w / 2 + .06]} color="#6f7b80" r={.01} shadow={false} />)}
    {Array.from({ length: Math.floor(b.h / .4) }, (_, i) => <R key={`r${i}`} args={[.36, .03, .03]} pos={[0, .3 + i * .4, b.w / 2 + .06]} color="#6f7b80" r={.01} shadow={false} />)}
  </group>
);

/** Picnic table with its two benches. */
export const Bench = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    <R args={[b.w, .07, b.d]} pos={[0, b.h - .035, 0]} color="#a8763f" r={.02} />
    {[-1, 1].map(s => <R key={s} args={[.08, b.h - .07, b.d * .8]} pos={[s * (b.w / 2 - .25), (b.h - .07) / 2, 0]} color="#8a5f33" r={.02} shadow={false} />)}
    {[-1, 1].map(s => <R key={`s${s}`} args={[b.w, .06, .26]} pos={[0, .45, s * (b.d / 2 + .3)]} color="#a8763f" r={.02} />)}
    {[-.6, .1, .7].map((x, i) => <group key={i} position={[x, b.h, (i % 2 ? .12 : -.1)]}><Cyl r={.06} h={.16} pos={[0, .08, 0]} color="#f2c14e" rt={.07} /><Cyl r={.065} h={.04} pos={[0, .18, 0]} color="#fff7e0" /></group>)}
  </group>
);

/** Two poles and a sagging line of warm bulbs. */
export function Lights({ b }: P) {
  const bulbs = 13, sag = .55;
  return <group position={[b.x, 0, b.z]}>
    {[-1, 1].map(s => <Cyl key={s} r={.05} h={b.h} pos={[s * b.w / 2, b.h / 2, 0]} color="#3d3a36" />)}
    {Array.from({ length: bulbs }, (_, i) => { const t = i / (bulbs - 1), x = (t - .5) * b.w, y = b.h - .1 - sag * 4 * t * (1 - t); return <mesh key={i} position={[x, y, 0]}><sphereGeometry args={[.06, 10, 8]} /><meshStandardMaterial color="#ffe1a0" emissive="#ffc46b" emissiveIntensity={1.6} /></mesh>; })}
  </group>;
}

export const Stool = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><Cyl r={.05} h={b.h - .06} pos={[0, (b.h - .06) / 2, 0]} color="#3d3a36" /><Cyl r={b.w / 2} h={.06} pos={[0, b.h - .03, 0]} color="#7a5230" seg={18} /><Cyl r={.16} h={.03} pos={[0, .25, 0]} color="#3d3a36" /></group>
);

/** The brewery's sign on the back wall: an amber mug with a white head, glowing at night. */
export const BrewSign = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    <R args={[b.w, 1.0, .1]} pos={[0, b.h - .5, 0]} color="#3b2a1d" r={.06} />
    <R args={[.42, .52, .06]} pos={[-.9, b.h - .52, .06]} color="#f2a93b" e="#f2a93b" ei={.8} r={.05} shadow={false} />
    <R args={[.46, .14, .06]} pos={[-.9, b.h - .22, .07]} color="#fff7e0" e="#fff7e0" ei={.6} r={.05} shadow={false} />
    {[0, 1, 2, 3].map(i => <R key={i} args={[.34, .4, .05]} pos={[-.25 + i * .42, b.h - .5, .06]} color="#f2a93b" e="#f2a93b" ei={.5} r={.04} shadow={false} />)}
    {[-1, 1].map(s => <Cyl key={s} r={.05} h={b.h - 1} pos={[s * (b.w / 2 - .2), (b.h - 1) / 2, 0]} color="#3d3a36" />)}
  </group>
);
