"use client";
// Ruen Thai: a teak house raised on posts, steep red gables with kalae finials, an open veranda at the front.
// Daily life happens in the shade underneath: the household's beds, a big water jar and a clay stove.
import type { StyleProps } from "./home.types";
import { B, C, Gable } from "./home.parts";
import { SideWindows } from "./home.rooms";

const RAISE = 1.9, WALL = 1.7;

export function StiltHome({ house, base, upper, upperRef }: StyleProps) {
  const { w, d } = house, room = d * .64, roomZ = -d / 2 + room / 2, deck = RAISE + .07;
  const posts = [-1, 0, 1].flatMap(ix => [-1, 0, 1].map(iz => [ix * (w / 2 - .18), iz * (d / 2 - .18)] as const));
  return <>
    {posts.map(([x, z]) => <C key={`${x}${z}`} r={.1} rt={.09} h={RAISE} p={[x, RAISE / 2, z]} m={base.wood} />)}
    <C r={.34} rt={.26} h={.7} p={[w / 2 - .7, .35, -d / 2 + .7]} m={base.dark} seg={20} />
    <C r={.22} h={.3} p={[-w / 2 + .7, .15, -d / 2 + .7]} m={base.pot} />
    {/* stairs up the side, to the veranda */}
    {Array.from({ length: 6 }, (_, i) => <B key={i} s={[.7, .06, .3]} p={[w / 2 + .45, .3 + i * .3, d / 2 - .4 - i * .28]} m={base.wood} />)}
    <group ref={upperRef}>
      <B s={[w + .1, .14, d + .1]} p={[0, RAISE, 0]} m={upper.floor} />
      <B s={[w, WALL, .12]} p={[0, deck + WALL / 2, -d / 2 + .06]} m={upper.wall} />
      {[-1, 1].map(side => <B key={side} s={[.12, WALL, room]} p={[side * (w / 2 - .06), deck + WALL / 2, roomZ]} m={upper.wall} />)}
      {[-1, 1].map(side => <B key={`t${side}`} s={[.14, WALL + .1, .14]} p={[side * (w / 2 - .07), deck + WALL / 2, roomZ + room / 2]} m={upper.trim} />)}
      <SideWindows w={w} y={deck + 1.0} zs={[roomZ]} mats={upper} />
      {/* veranda railing */}
      <B s={[w - .2, .08, .08]} p={[0, deck + .6, d / 2 - .06]} m={upper.trim} />
      {[-1, 1].map(side => <B key={`r${side}`} s={[.08, .08, d - room - .1]} p={[side * (w / 2 - .06), deck + .6, d / 2 - (d - room) / 2]} m={upper.trim} />)}
      {Array.from({ length: 9 }, (_, i) => <B key={`b${i}`} s={[.04, .6, .04]} p={[-w / 2 + .3 + i * (w - .6) / 8, deck + .3, d / 2 - .06]} m={upper.trim} />)}
      <B s={[1.2, .25, .6]} p={[-.4, deck + .12, roomZ + .2]} m={upper.wood} />
      {[0, 1, 2].map(i => <B key={`m${i}`} s={[.42, .22, .42]} p={[-1.2 + i * .8, deck + .11, roomZ + 1.0]} m={upper.fabric} />)}
      <group position={[0, 0, roomZ]}>
        <Gable w={w} d={room} y={deck + WALL} rise={1.75} m={upper.roof} gable={upper.trim} overhang={.35} />
        {[-1, 1].map(side => <group key={`k${side}`} position={[0, deck + WALL + 1.75, side * (room / 2 + .05)]}>
          {[-1, 1].map(lean => <B key={lean} s={[.07, .55, .05]} p={[lean * .12, .2, 0]} r={[0, 0, -lean * .5]} m={upper.trim} />)}
        </group>)}
      </group>
    </group>
  </>;
}
