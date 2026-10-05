// One hook for every home style: ghost the parts above the street when you look at the homes,
// follow someone who lives here, or the house stands between the camera and what it looks at.
// Also switches the windows on after dark (Bangkok time, like the sky).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Box3, Ray, Vector3, type Group, type Mesh } from "three";
import { lookAt } from "../focus";
import { bangkokHour, useOffice } from "../store";
import type { House } from "../world";
import { houseTop, makeMats } from "./home.materials";

const RAY = new Ray(), DIR = new Vector3(), HIT = new Vector3();

export function useHome(house: House, members: string[]) {
  const district = useOffice(s => s.manual?.kind === "zone" && s.manual.id === "neighborhood");
  const mine = useOffice(s => !!s.selected && members.includes(s.selected));
  const base = useMemo(() => makeMats(house.style, house.accent), [house.style, house.accent]);
  const upper = useMemo(() => makeMats(house.style, house.accent), [house.style, house.accent]);
  const upperRef = useRef<Group>(null), fade = useRef(1), ghost = useRef(false);
  const box = useMemo(() => new Box3(new Vector3(house.x - house.w / 2, 0, house.z - house.d / 2), new Vector3(house.x + house.w / 2, houseTop(house.style, house.floors), house.z + house.d / 2)), [house]);

  useEffect(() => () => { for (const set of [base, upper]) Object.values(set).forEach(material => material.dispose()); }, [base, upper]);
  useEffect(() => {
    const light = () => {
      const hour = bangkokHour(), night = hour >= 18 || hour < 6;
      for (const set of [base, upper]) { set.window.emissiveIntensity = night ? 1.1 : 0; set.window.color.set(night ? "#ffd79a" : "#9cc6d6"); }
    };
    light(); const timer = setInterval(light, 60000); return () => clearInterval(timer);
  }, [base, upper]);

  useFrame(({ camera }, delta) => {
    let blocking = false;
    if (lookAt.active) {
      const distance = camera.position.distanceTo(lookAt.target);
      if (distance < 30) {
        RAY.set(camera.position, DIR.copy(lookAt.target).sub(camera.position).normalize());
        const hit = RAY.intersectBox(box, HIT);
        blocking = !!hit && camera.position.distanceTo(hit) < distance - .3;
      }
    }
    // Looking at the district: see-through but still a building. Following someone inside: nearly gone.
    const level = mine || blocking ? .1 : district ? .3 : 1;
    if (ghost.current !== level < 1) {
      ghost.current = level < 1;
      upperRef.current?.traverse(node => { if ((node as Mesh).isMesh) (node as Mesh).castShadow = !ghost.current; });
    }
    if (Math.abs(fade.current - level) < .004) return;
    fade.current += (level - fade.current) * Math.min(1, delta * 6);
    if (Math.abs(fade.current - level) < .004) fade.current = level;
    for (const [name, material] of Object.entries(upper)) {
      const solid = name === "glass" ? .32 : 1, see = fade.current < .995 || name === "glass";
      if (material.transparent !== see) { material.transparent = see; material.needsUpdate = true; }
      material.opacity = solid * fade.current; material.depthWrite = fade.current > .995 && name !== "glass";
    }
  });
  return { base, upper, upperRef };
}
