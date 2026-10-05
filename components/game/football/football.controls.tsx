"use client";
// Your keys in a match: F kicks toward where you face (hold to charge), E passes to the nearest teammate. WASD and Shift are Human's.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Nav } from "../../crowd";
import { liveBall } from "./football.ball";
import { CHARGE_SECONDS, chargePower, KICK_RANGE, kickToward, nearest } from "./football.ai";
import { kickBall } from "./football.loop";
import { hint, setFootball, useFootball } from "./football.store";

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export function MatchControls({ nav }: { nav: Nav | null }) {
  const held = useRef<number | null>(null);
  useEffect(() => {
    if (!nav) return;
    /** Where the ball is relative to you, or null (with a hint) when it is out of reach or the ball is dead. */
    const reach = () => {
      const me = nav.playerRt, b = liveBall();
      if (!me || !b || useFootball.getState().match.phase !== "playing") return null;
      const p = b.translation();
      if (Math.hypot(p.x - me.x, p.z - me.z) > KICK_RANGE + .6) { hint("Get closer to the ball"); return null; }
      return { me, ball: { x: p.x, z: p.z } };
    };
    const kick = (power: number) => {
      const got = reach();
      if (got) kickBall(kickToward(got.ball, { x: got.ball.x + Math.sin(got.me.yaw), z: got.ball.z + Math.cos(got.me.yaw) }, power, .5 + power * .08));
    };
    const pass = () => {
      const got = reach();
      if (!got) return;
      const mates = useFootball.getState().roster.home.flatMap(id => { const rt = nav.rts.get(id); return rt ? [rt] : []; });
      const mate = nearest(got.ball, mates);
      if (!mate) { hint("No teammate to pass to"); return; }
      kickBall(kickToward(got.ball, mate, Math.min(11, 4 + Math.hypot(mate.x - got.ball.x, mate.z - got.ball.z) * 1.1), .4));
    };
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.code === "KeyF" && held.current === null) held.current = performance.now();
      if (event.code === "KeyE") pass();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "KeyF" || held.current === null) return;
      const seconds = (performance.now() - held.current) / 1000; held.current = null;
      setFootball({ charge: 0 }); kick(chargePower(seconds));
    };
    const blur = () => { held.current = null; setFootball({ charge: 0 }); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); held.current = null; };
  }, [nav]);
  useFrame(() => { if (held.current !== null) setFootball({ charge: Math.min(1, (performance.now() - held.current) / 1000 / CHARGE_SECONDS) }); });
  return null;
}
