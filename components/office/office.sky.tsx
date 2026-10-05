"use client";
// Light follows the real clock in Bangkok: a bright day, golden light at dawn and dusk, a blue night.
import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Color, type DirectionalLight } from "three";
import { bangkokHour } from "../store";
import type { World } from "../world";

type Mood = { sky: string; sun: string; sunPower: number; fill: number; bounce: string };
const DAY: Mood = { sky: "#cde7fb", sun: "#fff1d6", sunPower: 2.35, fill: .95, bounce: "#e6d9c4" };
const GOLDEN: Mood = { sky: "#fbd3b4", sun: "#ffad72", sunPower: 1.75, fill: .78, bounce: "#e3c2a8" };
const NIGHT: Mood = { sky: "#1f2444", sun: "#9aaeff", sunPower: .5, fill: .38, bounce: "#363052" };
const moodAt = (hour: number) => hour < 6 ? NIGHT : hour < 7 ? GOLDEN : hour < 17 ? DAY : hour < 19 ? GOLDEN : NIGHT;

/** The hour in Bangkok, looked at once a minute. */
function useHour() {
  const [hour, setHour] = useState(() => bangkokHour());
  useEffect(() => {
    const timer = window.setInterval(() => setHour(bangkokHour()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return hour;
}

export function Lights({ world }: { world: World }) {
  const mood = moodAt(useHour()), scene = useThree(three => three.scene), sun = useRef<DirectionalLight>(null);
  const reach = Math.max(world.w, world.d) / 2 + 4; // the shadow box covers the whole town
  useEffect(() => { scene.background = new Color(mood.sky); }, [scene, mood]);
  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow, { bias: -.0004, normalBias: .03 });
    Object.assign(light.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, far: reach * 4 });
    light.shadow.camera.updateProjectionMatrix();
  }, [reach]);
  return (
    <>
      <hemisphereLight args={["#ffffff", mood.bounce, mood.fill]} />
      <directionalLight ref={sun} castShadow color={mood.sun} intensity={mood.sunPower} position={[reach * .6, reach * 1.2, reach * .8]} />
    </>
  );
}
