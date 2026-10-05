"use client";
// Hands the physics world to browser checks (development builds only; see exposeForTests).
import { useRapier } from "@react-three/rapier";
import { useEffect } from "react";
import { exposeForTests } from "@/lib/dev-handles";

export function PhysicsHandle() {
  const { world } = useRapier();
  useEffect(() => exposeForTests({ __rapier: world }), [world]);
  return null;
}
