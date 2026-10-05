"use client";
// The football match in the 3D nation: goal sensors always, the ball, referee, players' rings and controls while a match runs.
import { useEffect, useMemo } from "react";
import type { Nav } from "../../crowd";
import { useOffice } from "../../store";
import { PITCH } from "../../world/world.sport";
import type { World } from "../../world";
import { GoalSensors, MatchBall } from "./football.ball";
import { MatchControls } from "./football.controls";
import { Confetti } from "./football.confetti";
import { MatchLoop } from "./football.loop";
import { Markers } from "./football.markers";
import type { Field } from "./football.rules";
import { endFootball, matchActive, useFootball } from "./football.store";

export default function FootballScene({ world, nav }: { world: World; nav: Nav | null }) {
  const live = useFootball(s => s.match.phase !== "idle"), walking = useOffice(s => s.walking);
  const zone = world.zones.find(z => z.id === "pitch");
  const field = useMemo<Field | null>(() => zone ? { cx: zone.x, cz: zone.z, halfLength: PITCH.halfLength, halfWidth: PITCH.halfWidth, mouth: PITCH.mouth, goalDepth: PITCH.goalDepth } : null, [zone]);
  useEffect(() => { if (!walking && matchActive()) endFootball(); }, [walking]); // stop walking = leave the match
  useEffect(() => () => { if (matchActive()) endFootball(); }, [world]);
  if (!field) return null;
  return <>
    <GoalSensors field={field} />
    {live && <><MatchBall field={field} /><MatchLoop field={field} nav={nav} /><MatchControls nav={nav} /><Markers nav={nav} /><Confetti field={field} /></>}
  </>;
}
