"use client";
// Modern villa: white cubes, a timber-clad upper box cantilevered back and right, a roof terrace with an umbrella.
import type { StyleProps } from "./home.types";
import { B, C, Plant, SLAB, STOREY } from "./home.parts";
import { Kitchen, LivingRoom, SideWindows } from "./home.rooms";

export function VillaHome({ house, base, upper, upperRef }: StyleProps) {
  const { w, d } = house, uw = w * .78, ud = d * .62, ux = w * .11, uz = -d / 2 + ud / 2, top = 2 * STOREY;
  return <>
    <B s={[w - .3, .03, d - .3]} p={[0, .015, 0]} m={base.floor} />
    <B s={[w, STOREY, .24]} p={[0, STOREY / 2, -d / 2 + .12]} m={base.wall} />
    {[-1, 1].map(side => <B key={side} s={[.24, STOREY, d]} p={[side * (w / 2 - .12), STOREY / 2, 0]} m={base.wall} />)}
    {[-1, 1].map(side => <B key={`c${side}`} s={[.12, STOREY, .12]} p={[side * (w / 2 - .1), STOREY / 2, d / 2 - .1]} m={base.trim} />)}
    <Kitchen w={w} d={d} mats={base} />
    <group ref={upperRef}>
      <B s={[w + .2, SLAB, d + .2]} p={[0, STOREY, 0]} m={upper.wall} />
      <B s={[w + .22, .06, d + .22]} p={[0, STOREY + .1, 0]} m={upper.trim} />
      <group position={[ux, 0, uz]}>
        <B s={[uw, STOREY, .2]} p={[0, STOREY + STOREY / 2, -ud / 2 + .1]} m={upper.wall} />
        {[-1, 1].map(side => <B key={side} s={[.2, STOREY, ud]} p={[side * (uw / 2 - .1), STOREY + STOREY / 2, 0]} m={upper.wood} />)}
        <B s={[uw - .3, .02, ud - .3]} p={[0, STOREY + SLAB / 2 + .01, 0]} m={upper.floor} />
        <B s={[uw - .4, 1.3, .04]} p={[0, STOREY + .85, ud / 2 - .05]} m={upper.glass} />
        <LivingRoom w={uw} d={ud} y={STOREY + SLAB / 2} mats={upper} />
        <SideWindows w={uw} y={STOREY + .95} zs={[0]} mats={upper} />
        <B s={[uw + .3, .18, ud + .3]} p={[0, top, 0]} m={upper.wall} />
        <B s={[uw + .32, .05, ud + .32]} p={[0, top + .1, 0]} m={upper.trim} />
      </group>
      {/* roof terrace in front of the upper box */}
      <B s={[w - .3, .5, .04]} p={[0, STOREY + .35, d / 2 - .05]} m={upper.glass} />
      {[-.6, .3].map(x => <group key={x} position={[x - w * .2, STOREY + .09, d / 2 - 1.0]}><B s={[.5, .12, 1.0]} p={[0, .18, 0]} m={upper.fabric} /><B s={[.5, .35, .12]} p={[0, .35, -.45]} m={upper.fabric} r={[-.4, 0, 0]} /></group>)}
      <C r={.03} h={1.6} p={[-w * .2 - .15, STOREY + .85, d / 2 - 1.7]} m={upper.dark} />
      <mesh position={[-w * .2 - .15, STOREY + 1.75, d / 2 - 1.7]} material={upper.accent} castShadow><coneGeometry args={[.9, .4, 16, 1, true]} /></mesh>
      <Plant p={[w / 2 - .5, STOREY + .09, d / 2 - .45]} mats={upper} />
    </group>
  </>;
}
