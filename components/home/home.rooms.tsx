"use client";
// Furnished rooms reused by several home styles.
import type { Mats } from "./home.materials";
import { B, C, Plant } from "./home.parts";

/** Kitchen along the back wall, plus a small fermenter and keg: every home brews a little. */
export function Kitchen({ w, d, mats }: { w: number; d: number; mats: Mats }) {
  const counter = Math.min(2.4, w * .38);
  return <>
    <B s={[counter, .88, .6]} p={[-w / 2 + .3 + counter / 2, .44, -d / 2 + .56]} m={mats.paper} />
    <B s={[counter, .05, .62]} p={[-w / 2 + .3 + counter / 2, .9, -d / 2 + .56]} m={mats.dark} />
    <B s={[.7, 1.7, .62]} p={[-w / 2 + .3 + counter + .45, .85, -d / 2 + .56]} m={mats.steel} />
    <group position={[w / 2 - .75, 0, -d / 2 + .7]}>
      {[-.14, .14].map(x => <C key={x} r={.025} h={.3} p={[x, .15, 0]} m={mats.dark} />)}
      <C r={.24} h={.62} p={[0, .61, 0]} m={mats.steel} seg={22} />
      <mesh position={[0, 1.04, 0]} material={mats.steel} castShadow><coneGeometry args={[.24, .24, 22]} /></mesh>
      <C r={.17} h={.46} p={[.5, .23, .12]} m={mats.steel} />
      <B s={[.1, .08, .06]} p={[0, .5, .25]} m={mats.dark} />
    </group>
  </>;
}

export function LivingRoom({ w, d, y, mats }: { w: number; d: number; y: number; mats: Mats }) {
  const back = -d / 2 + .24;
  return <group position={[0, y, 0]}>
    <B s={[1.7, .38, .72]} p={[-.35, .19, back + .5]} m={mats.fabric} />
    <B s={[1.7, .42, .2]} p={[-.35, .55, back + .16]} m={mats.fabric} />
    {[-1, 1].map(side => <B key={side} s={[.18, .5, .72]} p={[-.35 + side * .86, .25, back + .5]} m={mats.fabric} />)}
    <B s={[1.5, .015, 1.1]} p={[-.35, .01, back + 1.55]} m={mats.accent} />
    <B s={[.8, .3, .5]} p={[-.35, .15, back + 1.55]} m={mats.wood} />
    <B s={[.08, .62, 1.05]} p={[w / 2 - .32, .95, back + 1.2]} m={mats.dark} />
    <B s={[.3, .5, 1.1]} p={[w / 2 - .45, .25, back + 1.2]} m={mats.wood} />
    <Plant p={[-w / 2 + .55, 0, back + .35]} mats={mats} />
  </group>;
}

export function Study({ w, d, y, mats }: { w: number; d: number; y: number; mats: Mats }) {
  const back = -d / 2 + .24, books = [mats.accent, mats.dark, mats.paper, mats.leaf, mats.fabric];
  return <group position={[0, y, 0]}>
    <B s={[1.3, .06, .62]} p={[.4, .74, back + .55]} m={mats.wood} />
    {[-1, 1].map(side => <B key={side} s={[.06, .72, .58]} p={[.4 + side * .6, .36, back + .55]} m={mats.wood} />)}
    <B s={[.62, .38, .04]} p={[.4, 1.0, back + .38]} m={mats.glow} />
    <B s={[.46, .46, .46]} p={[.4, .23, back + 1.15]} m={mats.dark} />
    <B s={[1.2, 1.5, .34]} p={[-w / 2 + .95, .75, back + .17]} m={mats.wood} />
    {books.map((m, i) => <B key={i} s={[.16, .3, .26]} p={[-w / 2 + .5 + i * .22, .55 + (i % 2) * .5, back + .2]} m={m} />)}
    <B s={[1.3, .015, 1.0]} p={[.4, .01, back + 1.3]} m={mats.paper} />
    <Plant p={[w / 2 - .55, 0, back + .35]} mats={mats} scale={1.1} />
  </group>;
}

/** Side windows that glow after dark. */
export function SideWindows({ w, y, zs, mats }: { w: number; y: number; zs: number[]; mats: Mats }) {
  return <>{[-1, 1].flatMap(side => zs.map(z => <B key={`${side}${z}`} s={[.03, .72, .95]} p={[side * (w / 2 + .01), y, z]} m={mats.window} />))}</>;
}
