"use client";
// The ground everything stands on: the floor, streets, each district's rug and sign, and one collider per solid
// layout box. Clicking the ground walks you there (while walking) or throws a ball (in throw mode).
import { Html, RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { memo } from "react";
import { themeById } from "@/lib/themes";
import { sfx } from "../sound";
import { addBall, setOffice, useOffice } from "../store";
import { SurfaceMaterial } from "../Surface";
import type { World, Zone } from "../world";

const MARGIN = 6;       // the ground runs this far past the outermost district
const GRAVITY = 9.81;   // Rapier's default
const THROW_SPEED = 16; // m/s along the line to the target; sets the flight time

/** A click that was not the end of a drag (a few pixels of slop). */
function onGround(event: ThreeEvent<MouseEvent>) {
  if (event.delta > 4) return;
  const { walking, throwMode } = useOffice.getState();
  if (walking && !throwMode) {
    event.stopPropagation();
    setOffice({ walkTo: { x: event.point.x, z: event.point.z, run: event.nativeEvent.shiftKey } });
  } else if (throwMode) {
    event.stopPropagation();
    throwFromCamera(event);
  }
}

/** Throw from just below the eye so the ball lands on the clicked point: pick the flight time from the distance,
 *  then add the upward speed that gravity takes away over that time. */
function throwFromCamera({ camera, point }: ThreeEvent<MouseEvent>) {
  const from = camera.position, start = { x: from.x, y: from.y - .5, z: from.z };
  const flight = Math.max(.5, Math.hypot(point.x - start.x, point.y - start.y, point.z - start.z) / THROW_SPEED);
  const launch = (axis: "x" | "y" | "z") => (point[axis] - start[axis]) / flight;
  addBall([start.x, start.y, start.z], [launch("x"), launch("y") + GRAVITY * flight / 2, launch("z")]);
  sfx("whoosh");
}

/** Solid boxes block balls and walkers; decor boxes are drawn only. A thick slab under the town is the floor. */
function Solids({ world }: { world: World }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider position={[0, -.5, 0]} args={[world.w / 2 + MARGIN, .5, world.d / 2 + MARGIN]} />
      {world.boxes.map((box, index) => {
        if (box.decor) return null;
        const centre: [number, number, number] = [box.x, box.h / 2, box.z];
        return box.round
          ? <CylinderCollider key={index} position={centre} args={[box.h / 2, box.w / 2]} />
          : <CuboidCollider key={index} position={centre} args={[box.w / 2, box.h / 2, box.d / 2]} />;
      })}
    </RigidBody>
  );
}

/** A district's rug, and its name on a sign at the back edge. */
function District({ zone }: { zone: Zone }) {
  return (
    <group position={[zone.x, 0, zone.z]}>
      <RoundedBox args={[zone.w, .04, zone.d]} radius={.02} position-y={.02} receiveShadow onClick={onGround}>
        <meshStandardMaterial color={zone.floor} roughness={.9} />
      </RoundedBox>
      <Html center position={[0, 1.9, .2 - zone.d / 2]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="zone-sign">{zone.emoji} {zone.name}</div>
      </Html>
    </group>
  );
}

export const Rooms = memo(function Rooms({ world }: { world: World }) {
  const theme = themeById(useOffice(state => state.theme));
  const groundW = world.w + 2 * MARGIN, groundD = world.d + 2 * MARGIN;
  return (
    <>
      <Solids world={world} />
      <mesh rotation-x={-Math.PI / 2} position-y={-.001} receiveShadow onClick={onGround}>
        <planeGeometry args={[groundW, groundD]} />
        <SurfaceMaterial color={theme.ground} tile={theme.groundTile} w={groundW} d={groundD} cell={2.5} />
      </mesh>
      {world.streets.map((street, i) => <group key={`street-${i}`}>
        <mesh rotation-x={-Math.PI / 2} position={[street.x, street.kind === "road" ? .02 : .03, street.z]} receiveShadow><planeGeometry args={[street.w, street.d]} /><SurfaceMaterial color={street.kind === "road" ? theme.road : theme.walk} tile={street.kind === "road" ? theme.roadTile : theme.walkTile} w={street.w} d={street.d} cell={2} roughness={.95} /></mesh>
        {street.kind === "road" && Array.from({ length: Math.floor(street.w / 3) }, (_, j) => <mesh key={j} rotation-x={-Math.PI / 2} position={[street.x - street.w / 2 + 1.5 + j * 3, .04, street.z]}><planeGeometry args={[1.3, .08]} /><meshStandardMaterial color="#e9e4c3" /></mesh>)}
      </group>)}
      {world.zones.map(zone => <District key={zone.id} zone={zone} />)}
    </>
  );
});
