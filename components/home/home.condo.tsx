"use client";
// Condo for big households: stacked storeys with glass balconies, AC units and laundry, two rooftop tanks and a mast.
import type { StyleProps } from "./home.types";
import { B, C, Plant, SLAB, STOREY } from "./home.parts";
import { LivingRoom, SideWindows, Study } from "./home.rooms";

export function CondoHome({ house, base, upper, upperRef }: StyleProps) {
  const { w, d, floors, seed } = house, top = floors * STOREY, stack = (floors - 1) * STOREY;
  return <>
    <B s={[w - .3, .03, d - .3]} p={[0, .015, 0]} m={base.floor} />
    <B s={[w, STOREY, .24]} p={[0, STOREY / 2, -d / 2 + .12]} m={base.wall} />
    {[-1, 1].map(side => <B key={side} s={[.24, STOREY, d]} p={[side * (w / 2 - .12), STOREY / 2, 0]} m={base.wall} />)}
    {[-1, 1].map(side => <B key={`c${side}`} s={[.34, STOREY, .34]} p={[side * (w / 2 - .17), STOREY / 2, d / 2 - .17]} m={base.trim} />)}
    {/* lobby: a wall of mailboxes */}
    {Array.from({ length: 12 }, (_, i) => <B key={i} s={[.3, .22, .1]} p={[-.9 + (i % 4) * .6, .7 + Math.floor(i / 4) * .3, -d / 2 + .3]} m={i % 3 ? base.steel : base.accent} />)}
    <Plant p={[w / 2 - .6, 0, -d / 2 + .6]} mats={base} />
    <group ref={upperRef}>
      <B s={[w, stack, .24]} p={[0, STOREY + stack / 2, -d / 2 + .12]} m={upper.wall} />
      {[-1, 1].map(side => <B key={side} s={[.24, stack, d]} p={[side * (w / 2 - .12), STOREY + stack / 2, 0]} m={upper.wall} />)}
      {[-1, 1].map(side => <B key={`c${side}`} s={[.34, stack, .34]} p={[side * (w / 2 - .17), STOREY + stack / 2, d / 2 - .17]} m={upper.trim} />)}
      {Array.from({ length: floors - 1 }, (_, i) => {
        const y = (i + 1) * STOREY;
        return <group key={i}>
          <B s={[w + .3, SLAB, d + .3]} p={[0, y, .15]} m={upper.wall} />
          <B s={[w - .4, .02, d - .4]} p={[0, y + SLAB / 2 + .01, 0]} m={upper.floor} />
          <B s={[w + .1, .6, .03]} p={[0, y + .38, d / 2 + .28]} m={upper.glass} />
          <B s={[.5, .38, .3]} p={[w / 2 + .17, y + 1.2, -d / 4]} m={upper.paper} />
          {(i + seed) % 2 === 0 && [0, 1, 2].map(k => <B key={k} s={[.3, .4, .02]} p={[-w / 2 + .8 + k * .45, y + 1.25, d / 2 + .1]} m={k === 1 ? upper.accent : upper.paper} />)}
          <SideWindows w={w} y={y + .95} zs={[d / 6]} mats={upper} />
          {(i + seed) % 2 === 0 ? <LivingRoom w={w} d={d} y={y + SLAB / 2} mats={upper} /> : <Study w={w} d={d} y={y + SLAB / 2} mats={upper} />}
        </group>;
      })}
      <B s={[w + .3, .24, d + .3]} p={[0, top, .15]} m={upper.wall} />
      <B s={[w * .6, .22, .05]} p={[0, top + .3, d / 2 + .32]} m={upper.glow} />
      {[-1, 1].map(side => <group key={side} position={[side * w / 4, top + .12, -d / 4]}><B s={[.8, .3, .8]} p={[0, .15, 0]} m={upper.dark} /><C r={.34} h={.85} p={[0, .72, 0]} m={upper.steel} seg={22} /></group>)}
      <C r={.03} h={2.2} p={[w / 2 - .4, top + 1.2, -d / 2 + .4]} m={upper.steel} />
    </group>
  </>;
}
