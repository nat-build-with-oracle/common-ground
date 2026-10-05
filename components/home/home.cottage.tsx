"use client";
// Cottage: one storey of cream walls under a terracotta gable, a brick chimney and window flower boxes.
import type { StyleProps } from "./home.types";
import { B, Gable } from "./home.parts";
import { Kitchen, SideWindows } from "./home.rooms";

const WALL = 1.8;

export function CottageHome({ house, base, upper, upperRef }: StyleProps) {
  const { w, d } = house;
  return <>
    <B s={[w - .3, .03, d - .3]} p={[0, .015, 0]} m={base.floor} />
    <B s={[w, WALL, .22]} p={[0, WALL / 2, -d / 2 + .11]} m={base.wall} />
    {[-1, 1].map(side => <B key={side} s={[.22, WALL, d]} p={[side * (w / 2 - .11), WALL / 2, 0]} m={base.wall} />)}
    {[-1, 1].map(side => <B key={`c${side}`} s={[.16, WALL, .16]} p={[side * (w / 2 - .12), WALL / 2, d / 2 - .1]} m={base.trim} />)}
    <SideWindows w={w} y={1.05} zs={[-d / 4, d / 5]} mats={base} />
    {[-1, 1].flatMap(side => [-d / 4, d / 5].map(z => <B key={`f${side}${z}`} s={[.18, .14, .9]} p={[side * (w / 2 + .1), .62, z]} m={base.accent} />))}
    <Kitchen w={w} d={d} mats={base} />
    <group ref={upperRef}>
      <Gable w={w} d={d} y={WALL} rise={1.35} m={upper.roof} gable={upper.wall} overhang={.35} />
      <B s={[.45, 1.1, .45]} p={[w / 4, WALL + 1.2, -d / 4]} m={upper.pot} />
      <B s={[.55, .1, .55]} p={[w / 4, WALL + 1.78, -d / 4]} m={upper.dark} />
    </group>
  </>;
}
