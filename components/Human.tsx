"use client";
// You, walking in the nation. One more crowd agent steered by the keyboard: citizens step around you,
// balls bounce off you, and E says hi to whoever is closest. Nothing here talks to a real agent.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3, type Group, type Mesh } from "three";
import { greeting } from "@/lib/hud";
import Citizen from "./Citizen";
import type { Nav, Rt } from "./crowd";
import { humanSpawn, type World } from "./world";
import { addBall, setOffice, useOffice } from "./store";
import { sfx } from "./sound";
import { matchActive } from "./game/football/football.store";

const MOVE: Record<string, [number, number]> = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
const keys = new Set<string>(), FWD = new Vector3();
/** Units per second. Citizens stroll at 0.85; you walk at 1.9 and, with Shift, really run. */
export const WALK = 1.9, RUN = 6.5;
const SPOT = "office-town:walk-at";
/** Where you last stood in this tab (sessionStorage), if it is still inside this town. */
function lastSpot(world: World): { x: number; z: number } | null {
  try {
    const spot = JSON.parse(sessionStorage.getItem(SPOT) ?? "null") as { x?: unknown; z?: unknown } | null;
    if (!spot || typeof spot.x !== "number" || typeof spot.z !== "number") return null;
    return Math.abs(spot.x) <= world.w / 2 + 2 && Math.abs(spot.z) <= world.d / 2 + 2 ? { x: spot.x, z: spot.z } : null;
  } catch { return null; }
}

export default function Human({ world, nav }: { world: World; nav: Nav | null }) {
  const walking = useOffice(s => s.walking);
  const [rt, setRt] = useState<Rt>();
  const root = useRef<Group>(null), body = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (!walking || !nav) return;
    const at = lastSpot(world) ?? humanSpawn(world);
    setRt(nav.spawnPlayer(at.x, at.z));
    const save = window.setInterval(() => { const me = nav.playerRt; if (me) try { sessionStorage.setItem(SPOT, JSON.stringify({ x: +me.x.toFixed(2), z: +me.z.toFixed(2) })); } catch { /* storage blocked */ } }, 1000);
    return () => { window.clearInterval(save); nav.removePlayer(); setRt(undefined); };
  }, [walking, nav, world]);

  const travel = useOffice(s => s.travel), walkTo = useOffice(s => s.walkTo), selected = useOffice(s => s.selected);
  const marker = useRef<Mesh>(null), lastSelected = useRef<string | null>(null);
  useEffect(() => {
    if (!walkTo) return;
    if (walking && nav) nav.walkPlayerTo(walkTo.x, walkTo.z, walkTo.run);
    setOffice({ walkTo: null });
  }, [walkTo, walking, nav]);
  // Picking an agent while walking takes you to them: walk if they are near, warp if they are far.
  useEffect(() => {
    if (!walking || !nav || !selected || selected === lastSelected.current) { lastSelected.current = selected; return; }
    lastSelected.current = selected;
    const me = nav.playerRt, them = nav.rts.get(selected);
    if (!me || !them) return;
    const spot = { x: them.x, z: them.z + 1.3 };
    if (Math.hypot(spot.x - me.x, spot.z - me.z) < 14) nav.walkPlayerTo(spot.x, spot.z, true);
    else nav.teleportPlayer(spot.x, spot.z, Math.PI);
  }, [selected, walking, nav]);
  useEffect(() => {
    if (!travel) return;
    const zone = world.zones.find(candidate => candidate.id === travel);
    if (walking && nav && zone) nav.teleportPlayer(zone.x, zone.z + zone.d / 2 + .9, Math.PI);
    setOffice({ travel: null });
  }, [travel, walking, nav, world]);

  useEffect(() => {
    if (!walking || !nav) return;
    let quiet = 0;
    const say = (text: string) => { setOffice({ walkHint: text }); window.clearTimeout(quiet); quiet = window.setTimeout(() => setOffice({ walkHint: "" }), 4000); };
    const greet = () => {
      const me = nav.playerRt;
      if (!me) return;
      let nearest: string | null = null, best = 2.6;
      for (const [id, other] of nav.rts) { const d = Math.hypot(other.x - me.x, other.z - me.z); if (d < best) { best = d; nearest = id; } }
      const bot = nearest ? useOffice.getState().bots.find(candidate => candidate.id === nearest) : undefined;
      if (!bot) { say("Nobody within reach. Walk up to someone first."); return; }
      setOffice({ caption: { botId: bot.id, text: greeting(bot, nav.rts.get(bot.id)?.goal.label?.replace(/ \(simulated\)$/, "")) }, hovered: bot.id });
      sfx("pop");
      window.setTimeout(() => setOffice(state => state.caption?.botId === bot.id ? { caption: null, hovered: state.hovered === bot.id ? null : state.hovered } : {}), 6000);
    };
    const toss = () => {
      const me = nav.playerRt;
      if (!me) return;
      const sx = Math.sin(me.yaw), sz = Math.cos(me.yaw);
      addBall([me.x + sx * .7, 1.3, me.z + sz * .7], [sx * 7, 3.2, sz * 7]);
      sfx("whoosh");
    };
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const open = useOffice.getState();
      if (open.paletteOpen || open.terminalFull) return;
      if (MOVE[event.code] || event.code.startsWith("Shift")) { keys.add(event.code); if (MOVE[event.code]) event.preventDefault(); }
      if (event.repeat) return;
      if (matchActive()) return; // in a match E passes and F kicks (football.controls)
      if (event.code === "KeyE") greet();
      if (event.code === "KeyF") toss();
    };
    const up = (event: KeyboardEvent) => { keys.delete(event.code); };
    const blur = () => keys.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); keys.clear(); window.clearTimeout(quiet); setOffice({ walkHint: "" }); };
  }, [walking, nav]);

  useFrame(({ camera }) => {
    if (!walking || !nav || !rt) return;
    let ahead = 0, side = 0;
    for (const code of keys) { const move = MOVE[code]; if (move) { side += move[0]; ahead += move[1]; } }
    // Camera-relative: W walks away from the camera, D to its right.
    camera.getWorldDirection(FWD); FWD.y = 0; FWD.normalize();
    let vx = FWD.x * ahead - FWD.z * side, vz = FWD.z * ahead + FWD.x * side;
    const length = Math.hypot(vx, vz), speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN : WALK;
    if (length > 0) { vx = vx / length * speed; vz = vz / length * speed; }
    nav.steerPlayer(vx, vz);
    root.current?.position.set(rt.x, 0, rt.z);
    if (root.current) root.current.rotation.y = rt.yaw;
    const target = nav.playerTarget;
    if (marker.current) { marker.current.visible = !!target; if (target) marker.current.position.set(target.x, .03, target.z); }
    if (body.current?.isValid()) body.current.setNextKinematicTranslation({ x: rt.x, y: 0, z: rt.z });
  });

  if (!walking || !rt) return null;
  return <>
    <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[.28, .38, 24]} /><meshBasicMaterial color="#ffcf5a" transparent opacity={.85} /></mesh>
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[rt.x, 0, rt.z]}><CapsuleCollider args={[.4, .33]} position={[0, .73, 0]} /></RigidBody>
    <group ref={root} position={[rt.x, 0, rt.z]}>
      <Suspense fallback={null}><Citizen id="human:you" rt={rt} status="idle" /></Suspense>
      <mesh rotation-x={-Math.PI / 2} position-y={.04}><ringGeometry args={[.42, .53, 28]} /><meshBasicMaterial color="#ffcf5a" transparent opacity={.9} /></mesh>
      <Html position={[0, 2.05, 0]} center zIndexRange={[70, 0]} style={{ pointerEvents: "none" }}><div className="marker near"><div className="marker-name you">You</div></div></Html>
    </group>
  </>;
}
