"use client";
// One citizen in the scene: a body that follows its walker, a physics capsule balls bounce off, and a floating
// label with what they are doing, their name, and a peek at their terminal while you look at them.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { memo, Suspense, useRef } from "react";
import type { Group } from "three";
import type { OracleBot } from "@/lib/fleet-types";
import type { TerminalSnapshot } from "@/lib/terminal-types";
import type { Rt } from "./crowd";
import { setOffice, useOffice } from "./store";
import Citizen from "./Citizen";

/** What a citizen is doing, in words: observed status first, then the simulated daily life. */
function doing(bot: OracleBot, rt?: Rt) {
  // Sleep only once they are in bed; on the way they are visibly walking, so say so.
  const walkingHome = rt?.goal.kind === "home" && !rt.arrived;
  if (bot.status === "offline") return walkingHome ? "🚶 Offline · walking home (sim)" : "💤 Offline · home / sleep (sim)";
  if (bot.status === "blocked") return "✋ Needs input · waiting commons";
  if (bot.working) return "⌨ Working";
  if (rt?.goal.kind === "home") return walkingHome ? "🚶 Walking home (sim)" : "💤 Home / sleep (sim)";
  if (rt?.goal.kind === "waiting") return "? Unknown status · waiting commons";
  if (rt?.goal.label) return `${rt.goal.emoji || "☀"} ${rt.arrived ? "" : "Going to: "}${rt.goal.label} (sim)`;
  return `${bot.status} · off duty`;
}

type Hit = { at: number; text: string };
const COMPLAINT_MS = 2500; // how long "ouch" stays up after a ball hits them

/** Their terminal: the whole visible screen while you look at them, the last two lines otherwise. Click for full screen. */
function TerminalPeek({ bot, terminal, close }: { bot: OracleBot; terminal: TerminalSnapshot; close: boolean }) {
  const live = terminal.status === "live";
  const screen = live ? (close ? terminal.content : terminal.content.split("\n").slice(-2).join("\n")) || "(terminal is blank)" : terminal.error;
  const open = (event: { stopPropagation(): void }) => { event.stopPropagation(); setOffice({ selected: bot.id, terminalFull: bot.id }); };
  return (
    <div className={`terminal-cloud ${terminal.status} ${close ? "" : "compact"}`} style={{ pointerEvents: "auto", cursor: "zoom-in" }} title="Open full screen" onClick={open}>
      <header><span>⌘ {bot.name}</span><small>{live ? "⤢ FULL SCREEN" : "UNAVAILABLE"}</small></header>
      <pre>{screen}</pre>
    </div>
  );
}

function Label({ bot, rt, hit, now, close, terminal }: { bot: OracleBot; rt?: Rt; hit?: Hit; now: number; close: boolean; terminal?: TerminalSnapshot }) {
  const complaint = hit && now - hit.at < COMPLAINT_MS ? `😵 ${hit.text}` : null;
  return (
    <Html center position={[0, 2.05, 0]} zIndexRange={[close ? 60 : 30, 0]} style={{ pointerEvents: "none" }}>
      <div className={close ? "marker near" : "marker"}>
        {terminal && <TerminalPeek bot={bot} terminal={terminal} close={close} />}
        <div className={bot.status === "blocked" ? "marker-line ask" : "marker-line"}>{complaint ?? doing(bot, rt)}</div>
        {close && <div className="marker-name" style={{ background: bot.color }}>{bot.name}</div>}
      </div>
    </Html>
  );
}

type Props = { bot: OracleBot; rt?: Rt; hit?: Hit; now: number; focused: boolean; selected: boolean; hovered: boolean };
export const Bot = memo(function Bot({ bot, rt, hit, now, focused, selected, hovered }: Props) {
  const root = useRef<Group>(null), body = useRef<RapierRigidBody>(null);
  const terminal = useOffice(state => state.terminals[bot.id]);
  const close = hovered || selected || focused; // you are looking at them
  const peek = terminal && (close || bot.working) ? terminal : undefined;
  // Follow the crowd: the drawing and the physics body both go where the walker is.
  useFrame(() => {
    const group = root.current;
    if (!group || !rt) return;
    group.position.x = rt.x; group.position.z = rt.z; group.rotation.y = rt.yaw;
    if (body.current?.isValid()) body.current.setNextKinematicTranslation({ x: rt.x, y: 0, z: rt.z });
  });
  const start: [number, number, number] = [rt?.x ?? 0, 0, rt?.z ?? 0];
  return <>
    <RigidBody ref={body} type="kinematicPosition" colliders={false} userData={{ botId: bot.id }} position={start}>
      <CapsuleCollider args={[.4, .33]} position={[0, .73, 0]} />
    </RigidBody>
    <group ref={root} position={start}
      onClick={event => { event.stopPropagation(); setOffice({ selected: bot.id, manual: null, hudPanel: null }); }}
      onPointerOver={event => { event.stopPropagation(); setOffice({ hovered: bot.id }); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setOffice(state => state.hovered === bot.id ? { hovered: null } : {}); document.body.style.cursor = ""; }}>
      <Suspense fallback={<mesh position-y={.7}><capsuleGeometry args={[.25, .8, 4, 6]} /><meshStandardMaterial color={bot.color} /></mesh>}>
        <Citizen id={bot.id} rt={rt} status={bot.status} />
      </Suspense>
      {close && <mesh rotation-x={-Math.PI / 2} position-y={.05}><ringGeometry args={[.42, .49, 24]} /><meshBasicMaterial color={bot.color} transparent opacity={.7} /></mesh>}
      {(close || peek || bot.status === "blocked") && <Label bot={bot} rt={rt} hit={hit} now={now} close={close} terminal={peek} />}
    </group>
  </>;
});
