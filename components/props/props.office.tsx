"use client";
// Office and indoor furniture, drawn inside each layout box.
import { useOffice } from "../store";
import { Blinky, Cyl, R, Steam, type P } from "./props.parts";

/** A work desk with a monitor; the screen lights up in the owner's colour while they are working. */
export function Desk({ b }: P) {
  const working = useOffice(s => !!b.owner && !!s.bots.find(bot => bot.id === b.owner)?.working);
  const top = b.h, accent = b.accent ?? "#66d8aa";
  return <group position={[b.x, 0, b.z]}>
    <R args={[b.w, .06, b.d]} pos={[0, top - .03, 0]} color="#e9cfa6" r={.025} />
    {[-1, 1].map(side => <R key={side} args={[.06, top - .06, b.d * .8]} pos={[side * (b.w / 2 - .1), (top - .06) / 2, 0]} color="#bf9a6c" r={.02} shadow={false} />)}
    <R args={[b.w - .28, .05, .04]} pos={[0, top * .35, -b.d * .3]} color="#bf9a6c" r={.015} shadow={false} />
    <Cyl r={.06} rt={.04} h={.16} pos={[0, top + .08, .12]} color="#3b3f4c" />
    <R args={[.58, .36, .04]} pos={[0, top + .34, .1]} color="#2c303c" r={.02} />
    <mesh position={[0, top + .34, .077]} rotation-y={Math.PI}>
      <planeGeometry args={[.52, .3]} />
      <meshStandardMaterial color={working ? accent : "#23263a"} emissive={working ? accent : "#000000"} emissiveIntensity={working ? .9 : 0} />
    </mesh>
    <R args={[.42, .02, .14]} pos={[0, top + .01, -.12]} color="#d8dbe2" r={.008} shadow={false} />
    <Cyl r={.045} h={.11} pos={[b.w / 2 - .18, top + .055, -.05]} color={accent} />
  </group>;
}

/** Kitchen counter: a cabinet with drawers, a worktop, a board and a pot. Shop counters get a till instead. */
export function Counter({ b, kitchen }: P & { kitchen?: boolean }) {
  return <group position={[b.x, 0, b.z]}>
    <R args={[b.w, b.h - .05, b.d]} pos={[0, (b.h - .05) / 2, 0]} color={kitchen ? "#e7ece9" : "#f1d2a8"} r={.03} />
    {[-1, 0, 1].map(i => <R key={i} args={[b.w / 3.4, .03, .02]} pos={[i * b.w / 3, b.h * .7, b.d / 2 + .005]} color="#9aa5ab" r={.01} shadow={false} />)}
    <R args={[b.w + .05, .05, b.d + .05]} pos={[0, b.h - .025, 0]} color={kitchen ? "#5f6f78" : "#a77a52"} r={.015} />
    {kitchen
      ? <><R args={[.36, .025, .24]} pos={[-.25, b.h + .012, 0]} color="#d9a46b" r={.008} shadow={false} /><Cyl r={.09} rt={.1} h={.12} pos={[.3, b.h + .06, .02]} color="#c9504a" /></>
      : <R args={[.32, .18, .24]} pos={[.3, b.h + .09, 0]} color="#3d4250" r={.03} e="#6fd8a0" ei={.25} />}
  </group>;
}
export const Register = ({ b }: P) => <Counter b={b} />;
export const KitchenCounter = ({ b }: P) => <Counter b={b} kitchen />;

/** A plastered back wall with a skirting band and framed windows. */
export function Wall({ b }: P) {
  const panes = Math.max(1, Math.floor(b.w / 4));
  return <group position={[b.x, 0, b.z]}>
    <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#f7efe3" r={.05} />
    <R args={[b.w, .1, b.d + .03]} pos={[0, .05, 0]} color="#d9b58c" r={.02} shadow={false} />
    {b.accent && <R args={[b.w, .06, b.d + .03]} pos={[0, b.h - .03, 0]} color={b.accent} r={.02} shadow={false} />}
    {Array.from({ length: panes }, (_, i) => <group key={i} position={[-b.w / 2 + (b.w / panes) * (i + .5), b.h * .6, b.d / 2 + .004]}>
      <R args={[1.24, .58, .02]} pos={[0, 0, 0]} color="#e2d3bd" r={.01} shadow={false} />
      <mesh position={[0, 0, .012]}><planeGeometry args={[1.12, .48]} /><meshStandardMaterial color="#c4e3f5" emissive="#a9d6f2" emissiveIntensity={.3} /></mesh>
    </group>)}
  </group>;
}

export const Stove = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#eef1f3" r={.04} />
  <R args={[b.w * .7, b.h * .45, .02]} pos={[0, b.h * .4, b.d / 2 + .005]} color="#2f3440" r={.01} shadow={false} />
  {[-1, -.33, .33, 1].map(x => <Cyl key={x} r={.025} h={.03} pos={[x * b.w * .35, b.h * .82, b.d / 2 + .01]} color="#9aa3ab" />)}
  <Cyl r={.18} rt={.2} h={.2} pos={[-.28, b.h + .1, 0]} color="#e5734f" />
  <Cyl r={.15} h={.06} pos={[.3, b.h + .03, 0]} color="#5b636e" />
  <Steam pos={[-.28, b.h + .24, 0]} />
</group>;

export const Fridge = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#d8efe6" r={.08} />
  <R args={[b.w - .04, .015, .01]} pos={[0, b.h * .62, b.d / 2 + .002]} color="#a9c3b9" r={.004} shadow={false} />
  {[b.h * .8, b.h * .4].map(y => <R key={y} args={[.04, .32, .04]} pos={[b.w / 2 - .12, y, b.d / 2 + .03]} color="#8aa39a" r={.015} shadow={false} />)}
</group>;

export const Sofa = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, .36, b.d]} pos={[0, .18, 0]} color="#e98ba2" r={.1} />
  <R args={[b.w, .5, .22]} pos={[0, .55, -b.d / 2 + .11]} color="#d97690" r={.1} />
  {[-1, 1].map(side => <R key={side} args={[.2, .5, b.d]} pos={[side * (b.w / 2 - .1), .3, 0]} color="#d97690" r={.08} />)}
  {[-1, 1].map(side => <R key={`c${side}`} args={[.42, .3, .14]} pos={[side * b.w * .22, .5, -b.d / 2 + .3]} color="#f6d36b" r={.06} shadow={false} />)}
</group>;

const SPINES = ["#e05d5d", "#f2c14e", "#5fb878", "#4c8ff2", "#a874e8", "#ef8a4c"];
export function Shelf({ b }: P) {
  const rows = Math.max(2, Math.round(b.h / .42));
  return <group position={[b.x, 0, b.z]}>
    <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#bd9469" r={.03} />
    {Array.from({ length: rows - 1 }, (_, row) => Array.from({ length: 6 }, (_, i) => {
      const height = .2 + ((row * 7 + i * 3) % 4) * .03;
      return <R key={`${row}-${i}`} args={[.12, height, b.d - .08]} pos={[-b.w / 2 + .16 + i * (b.w - .26) / 6, .1 + row * (b.h / rows) + height / 2, .02]} color={SPINES[(row + i * 2) % SPINES.length]} r={.015} shadow={false} />;
    }))}
  </group>;
}

export const Tv = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, .42, b.d]} pos={[0, .21, 0]} color="#a8825f" r={.04} />
  <Cyl r={.03} h={.2} pos={[0, .52, 0]} color="#30343e" />
  <R args={[b.w - .14, .6, .05]} pos={[0, .92, 0]} color="#1f2230" r={.02} e="#6d8fff" ei={.35} />
</group>;

export const Plant = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <Cyl r={.17} rt={.23} h={.38} pos={[0, .19, 0]} color="#d8714f" />
  {[[.42, .3, .5], [.62, .24, .4], [.8, .17, .32]].map(([y, r, h], i) => <mesh key={i} position={[0, y + h / 2, 0]} castShadow><coneGeometry args={[r, h, 7]} /><meshStandardMaterial color={i % 2 ? "#5fb06f" : "#4e9d61"} flatShading /></mesh>)}
</group>;

export const Table = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <Cyl r={b.w / 2} h={.06} pos={[0, b.h - .03, 0]} color="#ecc78f" seg={36} />
  <Cyl r={.05} h={b.h - .06} pos={[0, (b.h - .06) / 2, 0]} color="#8d6a45" />
  <Cyl r={.18} rt={.1} h={.04} pos={[0, .02, 0]} color="#8d6a45" />
  <Cyl r={.04} rt={.06} h={.14} pos={[0, b.h + .07, 0]} color="#f3a7b8" />
</group>;

/** Planning board on an easel (a bar chart), or the café's chalk menu. */
export const Board = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h - .45, .06]} pos={[0, (b.h - .45) / 2 + .45, 0]} color={b.kind === "menu" ? "#344238" : "#fbfaf6"} r={.02} />
  {b.kind === "menu"
    ? [0, 1, 2, 3].map(i => <R key={i} args={[b.w * (.5 + (i % 2) * .2), .03, .01]} pos={[-b.w * .05, b.h - .25 - i * .22, .035]} color="#e8e4d4" r={.008} shadow={false} />)
    : [.35, .6, .45, .8].map((v, i) => <R key={i} args={[.16, v * .5, .015]} pos={[-b.w / 2 + .35 + i * .3, .55 + v * .25, .04]} color={SPINES[i]} r={.008} shadow={false} />)}
  {[-1, 1].map(side => <R key={side} args={[.05, .5, .05]} pos={[side * (b.w / 2 - .12), .25, .04]} color="#8b8f95" r={.015} shadow={false} />)}
</group>;

/** Espresso machine on a cabinet, cup under the spout, steam rising. */
export const Coffee = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h - .08, b.d]} pos={[0, (b.h - .08) / 2, 0]} color="#a37d58" r={.03} />
  <R args={[.46, .44, .4]} pos={[-.3, b.h + .14, 0]} color="#c9ccd3" r={.06} />
  <R args={[.2, .04, .08]} pos={[-.3, b.h + .02, .17]} color="#3a3d45" r={.01} shadow={false} />
  <Cyl r={.05} h={.08} pos={[-.3, b.h - .04, .2]} color="#ffffff" />
  <Steam pos={[-.3, b.h + .02, .2]} />
  <R args={[.24, .14, .24]} pos={[.32, b.h - .01, 0]} color="#e9d6b8" r={.03} shadow={false} />
</group>;

/** Water cooler with its blue bottle. */
export const Cooler = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h - .38, b.d]} pos={[0, (b.h - .38) / 2, 0]} color="#f2f5f9" r={.05} />
  <Cyl r={.17} rt={.13} h={.38} pos={[0, b.h - .19, 0]} color="#7cc4f2" />
  <R args={[.08, .05, .04]} pos={[0, b.h * .55, b.d / 2 + .02]} color="#5b9bd5" r={.01} shadow={false} />
</group>;

/** Server rack: dark cabinet, vents, blinking status LEDs. */
export const Rack = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#30343f" r={.03} />
  {Array.from({ length: 5 }, (_, i) => <R key={i} args={[b.w - .1, .02, .01]} pos={[0, .25 + i * b.h / 6, b.d / 2 + .004]} color="#454a57" r={.004} shadow={false} />)}
  {Array.from({ length: 8 }, (_, i) => <Blinky key={i} pos={[-.22 + (i % 4) * .1, .35 + Math.floor(i / 4) * .55, b.d / 2 + .012]} color={i % 3 ? "#58e08f" : "#62b8ff"} speed={1.5 + i * .4} />)}
</group>;

/** Arcade cabinet: glowing screen, a joystick and two buttons. */
export const Arcade = ({ b }: P) => <group position={[b.x, 0, b.z]}>
  <R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#7c4dee" r={.07} />
  <R args={[b.w - .16, .46, .04]} pos={[0, b.h - .5, b.d / 2 + .005]} color="#141626" r={.02} e="#ff5fd2" ei={.85} />
  <R args={[b.w - .1, .06, .22]} pos={[0, b.h * .55, b.d / 2 + .05]} color="#5b38b8" r={.02} shadow={false} />
  <Cyl r={.025} h={.12} pos={[-.12, b.h * .55 + .08, b.d / 2 + .05]} color="#222" />
  {[.06, .16].map(x => <Cyl key={x} r={.03} h={.02} pos={[x, b.h * .55 + .04, b.d / 2 + .06]} color={x < .1 ? "#ff5050" : "#ffd84a"} />)}
</group>;
