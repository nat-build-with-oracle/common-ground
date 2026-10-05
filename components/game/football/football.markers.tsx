"use client";
// A coloured ring under every player: team colour, so you can tell the sides apart. Yours is gold in Human already.
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Nav } from "../../crowd";
import { TEAM_COLORS } from "./football.rules";
import { useFootball } from "./football.store";

function Ring({ id, team, nav }: { id: string; team: 0 | 1; nav: Nav }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const rt = id === "you" ? nav.playerRt : nav.rts.get(id);
    if (ref.current) { ref.current.visible = !!rt; if (rt) ref.current.position.set(rt.x, .07, rt.z); }
  });
  return <group ref={ref}><mesh rotation-x={-Math.PI / 2}><ringGeometry args={[.5, .64, 28]} /><meshBasicMaterial color={TEAM_COLORS[team]} transparent opacity={.95} /></mesh></group>;
}

export function Markers({ nav }: { nav: Nav | null }) {
  const roster = useFootball(s => s.roster);
  if (!nav) return null;
  return <>{[...roster.home.map(id => [id, 0] as const), ["you", 0] as const, ...roster.away.map(id => [id, 1] as const)].map(([id, team]) => <Ring key={id} id={id} team={team} nav={nav} />)}</>;
}
