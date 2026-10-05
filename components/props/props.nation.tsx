"use client";
// Civic furniture: federation flagpoles, the globe, Parliament's dome, podium and member desks.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { useOffice } from "../store";
import { Cyl, R, type P } from "./props.parts";

const FLAG_COLORS = ["#c0392b", "#2e86c1", "#d4ac0d", "#28b463", "#8e44ad", "#e67e22", "#16a085", "#c2185b"];
const flagColor = (name: string) => FLAG_COLORS[[...name].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7) % FLAG_COLORS.length];

/** A pole per federation machine: flag up while its link is healthy, half-mast and grey while it is down, bare if unused. */
export function Flagpole({ b }: P) {
  const index = b.owner?.startsWith("node:") ? Number(b.owner.slice(5)) : -1;
  const node = useOffice(s => index >= 0 ? s.nodes[index] : undefined);
  const flag = useRef<Mesh>(null);
  const nation = b.owner === "nation", up = nation || !!node?.ok, present = nation || !!node;
  useFrame(({ clock }) => { if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2 + b.x) * (up ? .22 : .06); });
  const y = up ? b.h - .32 : b.h * .55;
  return <group position={[b.x, 0, b.z]}>
    <Cyl r={.1} h={.12} pos={[0, .06, 0]} color="#7d8a90" />
    <Cyl r={.035} h={b.h} pos={[0, b.h / 2, 0]} color="#c9d2d6" />
    <mesh position={[0, b.h + .04, 0]}><sphereGeometry args={[.06, 10, 8]} /><meshStandardMaterial color="#d4ac0d" metalness={.6} roughness={.3} /></mesh>
    {present && <group position={[0, y, 0]}><mesh ref={flag} position={[.36, 0, 0]} castShadow>
      <boxGeometry args={[.7, .44, .02]} />
      <meshStandardMaterial color={nation ? "#f3ead8" : up ? flagColor(node!.name) : "#8a8f93"} emissive={nation ? "#000" : up ? flagColor(node!.name) : "#000"} emissiveIntensity={up ? .25 : 0} />
    </mesh>{nation && <mesh position={[.36, 0, .015]}><circleGeometry args={[.13, 20]} /><meshStandardMaterial color="#b8442f" /></mesh>}</group>}
    {node && <Html position={[0, .5, .3]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}><div className={`flag-tag ${node.ok ? "" : "down"}`}>{node.self ? "★ " : ""}{node.name}<small>{node.ok ? `${node.agents} agent${node.agents === 1 ? "" : "s"}${node.via ? ` · via ${node.via}` : ""}` : "link down"}</small></div></Html>}
  </group>;
}

export function Globe({ b }: P) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * .25; });
  const r = b.w / 2 - .1;
  return <group position={[b.x, 0, b.z]}>
    <Cyl r={.5} rt={.35} h={.5} pos={[0, .25, 0]} color="#6b5a4a" />
    <Cyl r={.08} h={.6} pos={[0, .7, 0]} color="#c9a35a" />
    <group ref={g} position={[0, 1.0 + r, 0]} rotation-z={.41}>
      <mesh castShadow><sphereGeometry args={[r, 28, 20]} /><meshStandardMaterial color="#3d7fb8" roughness={.5} emissive="#1d4f7a" emissiveIntensity={.25} /></mesh>
      {[[.3, .4, .5], [-.5, -.1, .35], [.1, -.55, .3], [.55, .15, -.4], [-.25, .45, -.45]].map(([x, y, s], i) => <mesh key={i} position={[x * r, y * r, Math.sqrt(Math.max(0, 1 - x * x - y * y)) * r * (i % 2 ? -1 : 1)]}><sphereGeometry args={[s * r * .55, 10, 8]} /><meshStandardMaterial color="#6fbf73" flatShading /></mesh>)}
    </group>
    <mesh position={[0, 1.0 + r, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[r + .08, .025, 8, 40]} /><meshStandardMaterial color="#d4ac0d" metalness={.6} roughness={.3} /></mesh>
  </group>;
}

/** Parliament's facade against the back wall: plinth, columns, pediment band, and the dome. */
export const Dome = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}>
    <R args={[b.w, 1.5, b.d]} pos={[0, .75, 0]} color="#efe4cc" r={.05} />
    {[-1.5, -.5, .5, 1.5].map(x => <Cyl key={x} r={.13} h={1.5} pos={[x * b.w / 4.2, .75, b.d / 2 + .05]} color="#f6efe0" />)}
    <R args={[b.w + .2, .28, b.d + .25]} pos={[0, 1.64, .05]} color="#e2d3b0" r={.04} />
    <Cyl r={b.w * .26} h={.5} pos={[0, 2.03, 0]} color="#efe4cc" seg={32} />
    <mesh position={[0, 2.28, 0]} castShadow><sphereGeometry args={[b.w * .26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c9a35a" metalness={.45} roughness={.35} /></mesh>
    <Cyl r={.05} h={.5} pos={[0, 2.28 + b.w * .26 + .25, 0]} color="#d4ac0d" />
  </group>
);

export const Podium = ({ b }: P) => (
  <group position={[b.x, 0, b.z]}><R args={[b.w, b.h, b.d]} pos={[0, b.h / 2, 0]} color="#7a4b32" r={.06} /><R args={[b.w * .55, .3, .04]} pos={[0, b.h * .6, b.d / 2 + .01]} color="#c9a35a" r={.02} shadow={false} />{[-.2, .2].map(x => <Cyl key={x} r={.015} h={.35} pos={[x, b.h + .17, -.1]} color="#2b2f36" />)}</group>
);

/** A member's desk in the hemicycle, turned to face the podium (drawing only). */
export const MemberDesk = ({ b }: P) => (
  <group position={[b.x, 0, b.z]} rotation-y={b.rot ?? 0}><R args={[b.w, .05, b.d]} pos={[0, b.h - .025, 0]} color="#8a5a3c" r={.02} /><R args={[b.w, b.h - .05, .05]} pos={[0, (b.h - .05) / 2, b.d / 2 - .025]} color={b.accent ?? "#a9564a"} r={.02} /><Cyl r={.012} h={.22} pos={[.15, b.h + .11, -.05]} color="#2b2f36" /></group>
);
