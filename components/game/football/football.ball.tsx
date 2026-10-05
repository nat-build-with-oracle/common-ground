"use client";
// The match ball (a real Rapier body, distinct from the party balls) and the two goal sensors.
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { sfx } from "../../sound";
import { PITCH } from "../../world/world.sport";
import { goalFor } from "./football.store";
import type { Field } from "./football.rules";

/** The live match ball body, for the game loop and the controls. */
export const ballBody: { current: RapierRigidBody | null } = { current: null };
/** The match ball, only while it still exists in the physics world. */
export const liveBall = () => (ballBody.current?.isValid() ? ballBody.current : null);
const RADIUS = .25;

export function MatchBall({ field }: { field: Field }) {
  const last = useRef(0);
  return <RigidBody ref={body => { ballBody.current = body; }} colliders="ball" position={[field.cx, RADIUS + .05, field.cz]} userData={{ matchBall: true }}
    restitution={.62} friction={.7} linearDamping={.55} angularDamping={.6} mass={.45} ccd
    onCollisionEnter={() => { const v = liveBall()?.linvel(), speed = v ? Math.hypot(v.x, v.y, v.z) : 0, now = performance.now(); if (speed > 3 && now - last.current > 160) { last.current = now; sfx("thud", 0, Math.min(1, speed / 12)); } }}>
    <mesh castShadow><icosahedronGeometry args={[RADIUS, 1]} /><meshStandardMaterial color="#fbfbf6" roughness={.4} flatShading /></mesh>
    <mesh><icosahedronGeometry args={[RADIUS * 1.015, 1]} /><meshBasicMaterial color="#20262b" wireframe /></mesh>
  </RigidBody>;
}

/** Sensors behind each goal line. The ball touching one scores for the team attacking that end. */
export function GoalSensors({ field }: { field: Field }) {
  const { halfLength, mouth, goalDepth, postHeight } = PITCH;
  return <RigidBody type="fixed" colliders={false}>
    {([[-1, 1], [1, 0]] as const).map(([side, scorer]) =>
      <CuboidCollider key={side} sensor args={[goalDepth / 2 - .05, postHeight / 2, mouth / 2 - .12]} position={[field.cx + side * (halfLength + goalDepth / 2), postHeight / 2, field.cz]}
        onIntersectionEnter={({ other }) => { if ((other.rigidBody?.userData as { matchBall?: boolean } | undefined)?.matchBall) goalFor(scorer); }} />)}
  </RigidBody>;
}
