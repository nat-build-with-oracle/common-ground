"use client";
// The referee and the coach, once per frame: clock and phases, kickoff placement, simulated players running and kicking.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Nav } from "../../crowd";
import { sfx } from "../../sound";
import { liveBall } from "./football.ball";
import { KICK_RANGE, think, type Mover } from "./football.ai";
import { attackDir, hasKeeper, humanSpot, outOfPlay, startSpot, type Field, type Phase, type Team } from "./football.rules";
import { ballCam, dropTired, hint, tickMatch, useFootball } from "./football.store";

const lookYaw = (dx: number, dz: number) => Math.atan2(dx, dz);

/** Hit the ball: set its speed through an impulse, so mass never changes how hard a kick is. */
export function kickBall(v: { x: number; y: number; z: number }) {
  const b = liveBall();
  if (!b) return;
  b.setLinvel({ x: 0, y: 0, z: 0 }, true);
  const m = b.mass();
  b.applyImpulse({ x: v.x * m, y: v.y * m, z: v.z * m }, true);
  sfx("kick");
}
const resetBall = (field: Field, at = { x: field.cx, z: field.cz }) => {
  const b = liveBall();
  if (!b) return;
  b.setTranslation({ x: at.x, y: .35, z: at.z }, true); b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true);
};

export function MatchLoop({ field, nav }: { field: Field; nav: Nav | null }) {
  const prev = useRef<Phase>("idle"), drafted = useRef(new Set<string>()), needPlayer = useRef(false);
  const clock = useRef({ think: 0, prune: 0 }), cool = useRef(new Map<string, number>()), sent = useRef(new Map<string, { x: number; z: number; t: number }>());
  const release = () => { if (nav) for (const id of drafted.current) nav.release(id); drafted.current.clear(); sent.current.clear(); };
  useEffect(() => release, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    if (!nav) return;
    const { roster, match } = useFootball.getState();
    resetBall(field);
    ([roster.home, roster.away] as string[][]).forEach((ids, team) => {
      const here = ids.filter(id => nav.rts.has(id));
      here.forEach((id, i) => {
        const spot = startSpot(field, team as Team, i, here.length, match.kickoff === team);
        nav.place(id, spot.x, spot.z); nav.draft(id, spot.x, spot.z, lookYaw(attackDir(team as Team), 0)); drafted.current.add(id);
      });
    });
    needPlayer.current = true;
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, .1);
    if (useFootball.getState().match.phase === "idle") { if (prev.current !== "idle") { prev.current = "idle"; release(); } return; }
    tickMatch(dt);
    const { match, roster } = useFootball.getState(), phase = match.phase;
    if (phase !== prev.current) {
      if (phase === "kickoff") { restart(); sfx("whistle"); }
      else if (phase === "playing") sfx("whistle");
      else if (phase === "goal") { sfx("cheer"); sfx("whistle"); }
      else if (phase === "fulltime") { sfx("whistle"); window.setTimeout(() => sfx("whistle"), 380); window.setTimeout(() => sfx("whistle"), 760); }
      prev.current = phase;
    }
    const body = liveBall();
    if (!nav || !body) return;
    if (needPlayer.current && nav.playerRt) { const at = humanSpot(field); nav.place("player", at.x, at.z); needPlayer.current = false; }
    const p = body.translation(), v = body.linvel();
    ballCam.live = true; ballCam.x = p.x; ballCam.y = p.y; ballCam.z = p.z;
    if (phase === "kickoff") resetBall(field);
    if (phase !== "playing") return;
    const gone = p.y < -2 || outOfPlay(field, p.x, p.z);
    if (gone) { resetBall(field, gone === true ? undefined : gone); hint("Ball back in play"); return; }

    clock.current.prune += dt; clock.current.think += dt;
    if (clock.current.prune > 1) { clock.current.prune = 0; dropTired(); for (const id of drafted.current) if (!roster.home.includes(id) && !roster.away.includes(id)) { nav.release(id); drafted.current.delete(id); } }
    if (clock.current.think < .2) return;
    clock.current.think = 0;
    const now = performance.now(), ball = { x: p.x, z: p.z, vx: v.x, vz: v.z }, me = nav.playerRt;
    const movers = ([roster.home, roster.away] as string[][]).map((ids, team) => {
      const here = ids.filter(id => nav.rts.has(id) && drafted.current.has(id));
      const list: Mover[] = here.map((id, i) => ({ id, team: team as Team, x: nav.rts.get(id)!.x, z: nav.rts.get(id)!.z, keeper: hasKeeper(here.length) && i === 0 }));
      if (team === 0 && me) list.push({ id: "you", team: 0, x: me.x, z: me.z });
      return list;
    });
    for (const list of movers) for (const m of list) {
      if (m.id === "you") continue;
      const d = think(field, m, list, ball, !!m.keeper), last = sent.current.get(m.id);
      if (d.kick && Math.hypot(ball.x - m.x, ball.z - m.z) < KICK_RANGE + .3 && now - (cool.current.get(m.id) ?? 0) > 900) { cool.current.set(m.id, now); kickBall(d.kick); }
      if (!last || Math.hypot(d.target.x - last.x, d.target.z - last.z) > .5 || now - last.t > 700) {
        sent.current.set(m.id, { ...d.target, t: now });
        nav.draft(m.id, d.target.x, d.target.z, lookYaw(ball.x - m.x, ball.z - m.z), d.role === "chaser" ? 3 : 2.4);
      }
    }
  });
  return null;
}
