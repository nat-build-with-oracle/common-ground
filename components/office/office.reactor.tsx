"use client";
// The town's ears: a sound for every observed event, panned to where it happened on screen, and a voice for the
// citizen you are watching. While the one in frame is at work, you hear them type.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { Activity } from "@/lib/hub";
import type { Nav } from "../crowd";
import { phrase, sfx, speak } from "../sound";
import { onActivity, useOffice } from "../store";

const onScreen = new Vector3();

/** What to say out loud: their words if you are watching them, asks and failures always, starts and finishes when watched. */
function spoken(activity: Activity, watched: boolean) {
  switch (activity.kind) {
    case "say": return watched ? activity.label : null;
    case "ask": case "fail": return phrase(activity.kind);
    case "start": case "done": return watched ? phrase(activity.kind) : null;
    default: return null;
  }
}

export function Reactor({ nav }: { nav: Nav | null }) {
  const camera = useThree(three => three.camera);
  useEffect(() => onActivity(activity => {
    const where = nav?.rts.get(activity.botId), { focus, selected } = useOffice.getState();
    sfx(activity.kind, where ? onScreen.set(where.x, 1, where.z).project(camera).x * .8 : 0);
    const line = spoken(activity, activity.botId === focus || activity.botId === selected);
    if (line) speak(activity.botId, line);
  }), [nav, camera]);

  const nextKey = useRef(0);
  useFrame(({ clock }) => {
    const { focus, bots } = useOffice.getState(), now = clock.elapsedTime;
    if (now < nextKey.current || !focus || !bots.find(bot => bot.id === focus)?.working) return;
    nextKey.current = now + .08 + Math.random() * .22;
    sfx("type");
  });
  return null;
}
