"use client";
// Balls you throw: real rigid bodies. They bounce off walls, off you, and off citizens (who complain about it).
import { RigidBody, type CollisionEnterPayload, type RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { phrase, sfx, speak } from "../sound";
import { setOffice, useOffice, type Ball } from "../store";

const RADIUS = .26;
/** Bouncy, a little grippy, and slowing down over a few seconds. */
const MATERIAL = { restitution: .72, friction: .6, linearDamping: .15, angularDamping: .3, mass: .4 };

function complain(citizen: string) {
  const text = phrase("hit");
  setOffice(state => ({ hits: { ...state.hits, [citizen]: { at: Date.now(), text } } }));
  sfx("boing"); speak(citizen, text);
}

function ThrownBall({ ball }: { ball: Ball }) {
  const body = useRef<RapierRigidBody>(null), lastThud = useRef(0);
  const onHit = ({ other }: CollisionEnterPayload) => {
    const velocity = body.current?.isValid() ? body.current.linvel() : null;
    const speed = velocity ? Math.hypot(velocity.x, velocity.y, velocity.z) : 0;
    const citizen = (other.rigidBody?.userData as { botId?: string } | undefined)?.botId;
    if (citizen && speed > 2) return complain(citizen);
    const now = performance.now();
    if (speed <= 2.5 || now - lastThud.current < 150) return; // soft touches and rattles stay quiet
    lastThud.current = now;
    sfx("thud", 0, Math.min(1, speed / 10));
  };
  return (
    <RigidBody ref={body} colliders="ball" ccd position={ball.pos} linearVelocity={ball.vel} {...MATERIAL} onCollisionEnter={onHit}>
      <mesh castShadow><sphereGeometry args={[RADIUS, 24, 18]} /><meshStandardMaterial color={ball.color} roughness={.35} /></mesh>
    </RigidBody>
  );
}

export function Balls() {
  const balls = useOffice(state => state.balls);
  return balls.map(ball => <ThrownBall key={ball.id} ball={ball} />);
}
