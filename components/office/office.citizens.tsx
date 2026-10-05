"use client";
// Everyone in town. Goals are re-decided a couple of times a second, the crowd steps every frame, and each
// citizen draws itself where the crowd says it is.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Bot } from "../Bot";
import type { Nav } from "../crowd";
import { useOffice } from "../store";
import type { World } from "../world";

const THINK_EVERY = .4; // seconds between goal decisions

/** Wall-clock time that ticks once a second, for labels that expire (a complaint shows for 2.5 s). */
function useSeconds() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function Citizens({ world, nav }: { world: World; nav: Nav | null }) {
  const bots = useOffice(state => state.bots), hits = useOffice(state => state.hits);
  const focus = useOffice(state => state.focus), selected = useOffice(state => state.selected), hovered = useOffice(state => state.hovered);
  const now = useSeconds(), sinceThought = useRef(0);
  useFrame((_, dt) => {
    if (!nav) return;
    sinceThought.current += dt;
    if (sinceThought.current >= THINK_EVERY) {
      sinceThought.current = 0;
      const { bots, groups, feed, routinesEnabled } = useOffice.getState();
      nav.think(performance.now(), bots, groups, feed, routinesEnabled);
    }
    nav.update(dt);
  });
  return bots.filter(bot => world.seats.has(bot.id)).map(bot => (
    <Bot key={bot.id} bot={bot} rt={nav?.rts.get(bot.id)} hit={hits[bot.id]} now={now}
      focused={bot.id === focus} selected={bot.id === selected} hovered={bot.id === hovered} />
  ));
}
