"use client";
// Thai townhouse: concrete frame, cut away at the street like a dollhouse, rooftop water tank and stair box.
import type { StyleProps } from "./home.types";
import { B, C, Plant, SLAB, STOREY } from "./home.parts";
import { Kitchen, LivingRoom, SideWindows, Study } from "./home.rooms";

export function TownhouseHome({ house, base, upper, upperRef }: StyleProps) {
  const { w, d, floors, seed } = house, top = floors * STOREY, stack = (floors - 1) * STOREY;
  return <>
    <B s={[w - .3, .03, d - .3]} p={[0, .015, 0]} m={base.floor} />
    <B s={[w, STOREY, .24]} p={[0, STOREY / 2, -d / 2 + .12]} m={base.wall} />
    {[-1, 1].map(side => <B key={side} s={[.24, STOREY, d]} p={[side * (w / 2 - .12), STOREY / 2, 0]} m={base.wall} />)}
    {[-1, 1].map(side => <B key={`c${side}`} s={[.3, STOREY, .3]} p={[side * (w / 2 - .15), STOREY / 2, d / 2 - .15]} m={base.wall} />)}
    <Kitchen w={w} d={d} mats={base} />
    <group ref={upperRef}>
      <B s={[w, stack, .24]} p={[0, STOREY + stack / 2, -d / 2 + .12]} m={upper.wall} />
      {[-1, 1].map(side => <B key={side} s={[.24, stack, d]} p={[side * (w / 2 - .12), STOREY + stack / 2, 0]} m={upper.wall} />)}
      {[-1, 1].map(side => <B key={`c${side}`} s={[.3, stack, .3]} p={[side * (w / 2 - .15), STOREY + stack / 2, d / 2 - .15]} m={upper.wall} />)}
      {Array.from({ length: floors - 1 }, (_, i) => {
        const y = (i + 1) * STOREY;
        return <group key={i}>
          <B s={[w, SLAB, d]} p={[0, y, 0]} m={upper.wall} />
          <B s={[w - .4, .02, d - .4]} p={[0, y + SLAB / 2 + .01, 0]} m={upper.floor} />
          <B s={[w - .5, .55, .03]} p={[0, y + .38, d / 2 - .1]} m={upper.glass} />
          <B s={[w - .5, .04, .06]} p={[0, y + .66, d / 2 - .1]} m={upper.steel} />
          <SideWindows w={w} y={y + .95} zs={[-d / 4, d / 6]} mats={upper} />
          {(i + seed) % 2 === 0 ? <LivingRoom w={w} d={d} y={y + SLAB / 2} mats={upper} /> : <Study w={w} d={d} y={y + SLAB / 2} mats={upper} />}
        </group>;
      })}
      <B s={[w + .12, .22, d + .12]} p={[0, top, 0]} m={upper.wall} />
      {[-1, 1].map(side => <B key={`pz${side}`} s={[w + .12, .38, .1]} p={[0, top + .3, side * (d / 2 + .01)]} m={upper.wall} />)}
      {[-1, 1].map(side => <B key={`px${side}`} s={[.1, .38, d + .12]} p={[side * (w / 2 + .01), top + .3, 0]} m={upper.wall} />)}
      <B s={[w * .45, .16, .05]} p={[0, top + .3, d / 2 + .08]} m={upper.glow} />
      <B s={[1.5, 1.05, 1.3]} p={[-w / 2 + 1.0, top + .63, -d / 2 + .9]} m={upper.wall} />
      <B s={[.6, .85, .04]} p={[-w / 2 + 1.0, top + .53, -d / 2 + 1.56]} m={upper.dark} />
      <B s={[.8, .3, .8]} p={[w / 2 - .85, top + .26, -d / 2 + .85]} m={upper.dark} />
      <C r={.34} h={.85} p={[w / 2 - .85, top + .84, -d / 2 + .85]} m={upper.steel} seg={24} />
      <C r={.36} h={.06} p={[w / 2 - .85, top + 1.29, -d / 2 + .85]} m={upper.steel} seg={24} />
      <Plant p={[-w / 2 + .5, top + .11, d / 2 - .5]} mats={upper} scale={.9} />
      <Plant p={[w / 2 - .5, top + .11, d / 2 - .5]} mats={upper} scale={.9} />
    </group>
  </>;
}
