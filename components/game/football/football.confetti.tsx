"use client";
// Goal celebration: a burst of paper confetti above the goal that just scored.
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { PITCH } from "../../world/world.sport";
import { TEAM_COLORS, type Field } from "./football.rules";
import { useFootball } from "./football.store";

const COUNT = 70, dummy = new Object3D(), tint = new Color();
type Bit = { x: number; y: number; z: number; vx: number; vy: number; vz: number; spin: number };

export function Confetti({ field }: { field: Field }) {
  const mesh = useRef<InstancedMesh>(null), bits = useRef<Bit[]>([]), live = useRef(false);
  useFrame((_, delta) => {
    const m = mesh.current, { match } = useFootball.getState();
    if (!m) return;
    if (match.phase === "goal" && !live.current && match.scorer !== null) {
      live.current = true;
      const x = field.cx + (match.scorer === 0 ? 1 : -1) * (PITCH.halfLength - 1.5);
      bits.current = Array.from({ length: COUNT }, (_, i) => ({ x, y: 1.5, z: field.cz + (Math.random() - .5) * 3, vx: (Math.random() - .5) * 6, vy: 4 + Math.random() * 5, vz: (Math.random() - .5) * 6, spin: Math.random() * 9 }));
      bits.current.forEach((_, i) => m.setColorAt(i, tint.set(i % 3 === 0 ? TEAM_COLORS[match.scorer!] : ["#ffd35a", "#f4f1e6", "#8ad8e0"][i % 3])));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    if (match.phase !== "goal") live.current = false;
    const dt = Math.min(delta, .05);
    m.visible = live.current;
    bits.current.forEach((b, i) => {
      b.vy -= 7 * dt; b.x += b.vx * dt; b.y = Math.max(.05, b.y + b.vy * dt); b.z += b.vz * dt; if (b.y <= .05) { b.vx = b.vz = 0; b.vy = 0; }
      dummy.position.set(b.x, b.y, b.z); dummy.rotation.set(b.spin * b.y, b.spin, 0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false} visible={false}><boxGeometry args={[.14, .02, .09]} /><meshBasicMaterial /></instancedMesh>;
}
